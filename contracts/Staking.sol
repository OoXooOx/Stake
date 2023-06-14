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
        require(success && abi.decode(response, (bool)), "Failed send funds");
        if (stakeNonce[_msgSender()].current() == 0) {
            unchecked {
                uniqueAddressesStaked++;
            }
        }
        stakeNonce[_msgSender()].increment();
        Stake storage newStake = stakeBalances[_msgSender()][stakeNonce[_msgSender()].current()];
        newStake.amount=_amount;
        newStake.startAt=block.timestamp;
        newStake.endAt=block.timestamp+getSecInDays(_timeInDays);
        tokensStakedByAddress[_msgSender()]+=_amount;
        totalTokensStaked+=_amount;
        uint length = rewards_.length;//6
        uint rewardTime;
        for (uint i=0; i<length;){
            if (_timeInDays>=rewards_[i]) {
                rewardTime = rewards_[i];
            }
            unchecked{++i;}
        }
        stakeBalances[_msgSender()][stakeNonce[_msgSender()].current()].rewardValue=
        _amount/100*rewards[rewardTime]*_timeInDays/DAYS_IN_YEAR;
        emit deposit(stakeNonce[_msgSender()].current(), _msgSender());
    }

    function claim (uint _stakeNumber) external {
        require(block.timestamp>=stakeBalances[_msgSender()][_stakeNumber].endAt,
        "too early");
        require(!stakeBalances[_msgSender()][_stakeNumber].withdraw, "already receive");
        require(_stakeNumber!=0 && _stakeNumber<=stakeNonce[_msgSender()].current(), "don't do this");
        stakeBalances[_msgSender()][_stakeNumber].withdraw=true;
        tokensStakedByAddress[_msgSender()]-=stakeBalances[_msgSender()][_stakeNumber].amount;
        uint extraRewards = getDaysFromSec((block.timestamp-stakeBalances[_msgSender()][_stakeNumber].endAt))
        *stakeBalances[_msgSender()][_stakeNumber].rewardValue
        /getDaysFromSec(stakeBalances[_msgSender()][_stakeNumber].endAt-stakeBalances[_msgSender()][_stakeNumber].startAt);
        (bool success, bytes memory response) = address(TST).call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                _msgSender(),
                stakeBalances[_msgSender()][_stakeNumber].amount+extraRewards+
                stakeBalances[_msgSender()][_stakeNumber].rewardValue)
            );
        require(success && abi.decode(response, (bool)), "Failed to send funds!");
        totalTokensStaked-=stakeBalances[_msgSender()][_stakeNumber].amount;
        emit withdrawal(_stakeNumber, _msgSender());
    }

    function sendBackDeposit(address _staker, uint _stakeNumber) external onlyOwner {
        require(block.timestamp>=stakeBalances[_staker][_stakeNumber].endAt,
        "too early");
        require(!stakeBalances[_staker][_stakeNumber].withdraw, "already receive");
        require(_stakeNumber!=0 && _stakeNumber<=stakeNonce[_staker].current(), "don't do this");
        stakeBalances[_staker][_stakeNumber].withdraw=true;
        tokensStakedByAddress[_staker]-=stakeBalances[_staker][_stakeNumber].amount;
        uint extraRewards = getDaysFromSec((block.timestamp-stakeBalances[_staker][_stakeNumber].endAt))
        *stakeBalances[_staker][_stakeNumber].rewardValue
        /getDaysFromSec(stakeBalances[_staker][_stakeNumber].endAt-stakeBalances[_staker][_stakeNumber].startAt);
        (bool success, bytes memory response) = address(TST).call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                _staker,
                stakeBalances[_staker][_stakeNumber].amount+extraRewards+
                stakeBalances[_staker][_stakeNumber].rewardValue)
            );
        require(success && abi.decode(response, (bool)), "Failed to send funds!");
        totalTokensStaked-=stakeBalances[_staker][_stakeNumber].amount;
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
