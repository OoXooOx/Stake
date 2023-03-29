import { Component } from "react";
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Stake from "./Stake";
import About from "./About";
import Contact from "./Contact";
import Home from "./Home";
import NavBar from './Navbar';
import Buy from "./Buy";

export default class Header extends Component {
    render() {
        return (
            <>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<NavBar />}>
                            <Route index element={<Home />} />
                            <Route path='buy' element={<Buy />} />
                            <Route path='about' element={<About />} />
                            <Route path='contact' element={<Contact />} />
                            <Route path='stake' element={<Stake />} />
                            <Route path='*' element={<Navigate replace to="/" />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </>
        )
    }
}