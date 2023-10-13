
// SPDX-License-Identifier: MIT

// Need fix totalStakeTokens whaen user invoke claim
// Need add possibility delete rewards 
// Optionally fix unique addresses when user invoke claim
// Optionally add possibility for stake for 1 hour for test
pragma solidity 0.8.17;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor() {
        _transferOwnership(_msgSender());
    }
    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        _transferOwnership(newOwner);
    }
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

library Counters {
    struct Counter {
        uint _value;
    }
    function current(Counter storage counter) internal view returns (uint) {
        return counter._value;
    }
    function increment(Counter storage counter) internal {
        unchecked {counter._value += 1;}
    }
}

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
}

contract Staking is Ownable {
    constructor (IERC20 _TST) {
        TST=_TST;
    }
    IERC20  public immutable TST;
    uint constant SEC_IN_DAY=86400;
    uint constant DAYS_IN_YEAR=365;
    uint public uniqueAddressesStaked;
    uint public totalTokensStaked;
    using Counters for Counters.Counter;
    struct Stake {
        uint amount;
        uint startAt;
        uint endAt;
        uint rewardValue; // 1 year - 30%  6 month - 24%   3 month - 20%  2 month - 18%  1 month - 12%
        bool withdraw;
    }
    uint[] public rewards_;
    mapping(uint=>uint) public rewards;
    mapping(address=>mapping(uint=>Stake)) public stakeBalances;
    mapping(address=>Counters.Counter) public stakeNonce;
    mapping(address=>uint) public tokensStakedByAddress;
    bool public stakingEnabled;
    event deposit(uint stakeId, address staker);
    event withdrawal(uint stakeId, address claimer);

    function stake (uint _amount, uint _timeInDays) external {
        require(stakingEnabled, "disabled"); 
        require(_amount!=0, "Wrong amount");
        require(_timeInDays>=30, "30 days min");
        (bool success, bytes memory response) = address(TST).call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                _msgSender(),
                address(this),
                _amount)
            );
        require(success && (response.length == 0 || abi.decode(response, (bool))), "Failed send funds");
        if (stakeNonce[_msgSender()].current() == 0) {
            unchecked {
                uniqueAddressesStaked++;
            }
        }
        stakeNonce[_msgSender()].increment();
        uint stakeCurrentNonce = stakeNonce[_msgSender()].current();
        Stake storage newStake = stakeBalances[_msgSender()][stakeCurrentNonce];
        newStake.amount=_amount;
        newStake.startAt=block.timestamp;
        newStake.endAt=block.timestamp+getSecInDays(_timeInDays);
        unchecked {
            tokensStakedByAddress[_msgSender()]+=_amount;
            totalTokensStaked+=_amount;
        }
        uint length = rewards_.length;//6
        uint rewardTime;
        for (uint i=0; i<length;){
            if (_timeInDays>=rewards_[i]) {
                rewardTime = rewards_[i];
            }
            unchecked{++i;}
        }
        newStake.rewardValue=_amount/100*rewards[rewardTime]*_timeInDays/DAYS_IN_YEAR;
        emit deposit(stakeCurrentNonce, _msgSender());
    }

    function claim (uint _stakeNumber) external {
        Stake storage claimStake = stakeBalances[_msgSender()][_stakeNumber];
        require(block.timestamp>=claimStake.endAt, "too early");
        require(!claimStake.withdraw, "already receive");
        require(_stakeNumber!=0 && _stakeNumber<=stakeNonce[_msgSender()].current(), "don't do this");
        claimStake.withdraw=true;
        unchecked {
            tokensStakedByAddress[_msgSender()]-=claimStake.amount;
            totalTokensStaked-=claimStake.amount;
        }
        uint extraRewards = getDaysFromSec((block.timestamp-claimStake.endAt))
        *claimStake.rewardValue
        /getDaysFromSec(claimStake.endAt-claimStake.startAt);
        (bool success, bytes memory response) = address(TST).call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                _msgSender(),
                claimStake.amount+extraRewards+claimStake.rewardValue)
            );
        require(success && (response.length == 0 || abi.decode(response, (bool))), "Failed send funds");
        emit withdrawal(_stakeNumber, _msgSender());
    }

    function sendBackDeposit(address _staker, uint _stakeNumber) external onlyOwner {
        Stake storage sendBackStake = stakeBalances[_staker][_stakeNumber];
        require(block.timestamp>=sendBackStake.endAt, "too early");
        require(!sendBackStake.withdraw, "already receive");
        require(_stakeNumber!=0 && _stakeNumber<=stakeNonce[_staker].current(), "don't do this");
        sendBackStake.withdraw=true;
        unchecked {
            tokensStakedByAddress[_staker]-=sendBackStake.amount;
            totalTokensStaked-=sendBackStake.amount;
        }
        uint extraRewards = getDaysFromSec((block.timestamp-sendBackStake.endAt))
        *sendBackStake.rewardValue
        /getDaysFromSec(sendBackStake.endAt-sendBackStake.startAt);
        (bool success, bytes memory response) = address(TST).call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                _staker,
                sendBackStake.amount+extraRewards+sendBackStake.rewardValue)
            );
        require(success && (response.length == 0 || abi.decode(response, (bool))), "Failed send funds");
        emit withdrawal(_stakeNumber, _staker);
    }
    //↓↓↓↓↓↓// SETTER //↓↓↓↓↓↓
    ////////////////////////////
    function setRewards (uint _percent, uint _timeInDays) external onlyOwner {
        rewards[_timeInDays]=_percent;
        rewards_.push(_timeInDays);
    }
    function setStakeToggle() external onlyOwner {
        if (!stakingEnabled) {
            stakingEnabled=true;
        } else {
            stakingEnabled=false;
        }
    }
    //↓↓↓↓↓↓// GETTER //↓↓↓↓↓↓
    ////////////////////////////
    function getSecInDays (uint _timeInDays) internal pure returns (uint){
        return _timeInDays*SEC_IN_DAY;
    }
    function getDaysFromSec (uint _timeInSec) internal pure returns (uint) {
        return _timeInSec/SEC_IN_DAY;
    }
}
