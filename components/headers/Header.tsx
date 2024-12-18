"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import styles from '../../styles/LandingPage.module.css';
import Link from 'next/link';
import Image from 'next/image';
import DropDowns from '../../styles/DropDowns.module.css';

const LandingHeader: React.FC = () => {
    const [isLoading] = useState(false);

    const rulesBtnRef = useRef(null);
    const awardsBtnRef = useRef(null);
    const rankingsBtnRef = useRef(null);
    const gymRankingsBtnRef = useRef(null);
    const logoRef = useRef(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const animateHeaderAndLogo = () => {
        gsap.fromTo(rulesBtnRef.current, { x: -200 }, { x: 0, duration: 1 });
        gsap.fromTo(awardsBtnRef.current, { x: -200 }, { x: 0, duration: 1 });
        gsap.fromTo(rankingsBtnRef.current, { x: 200 }, { x: 0, duration: 1 });
        gsap.fromTo(gymRankingsBtnRef.current, { x: 200 }, { x: 0, duration: 1 });
        gsap.fromTo(logoRef.current, { y: -200 }, { y: 0, duration: 1 });
    };

    useEffect(() => {
        if (!isLoading) {
            animateHeaderAndLogo();
        }
    }, [isLoading]);

    useEffect(() => {
        if (dropdownVisible) {
            gsap.fromTo(
                dropdownRef.current,
                { y: -10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, delay: 0.2 }
            );
        }
    }, [dropdownVisible]);

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <div className="headerLinks">
            {dropdownVisible && (
                <div className={DropDowns.overlay} ref={overlayRef} onClick={toggleDropdown}>
                    <div
                        className={DropDowns.dropdown}
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '5px' }}>
                            <Link
                                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                                href="/rankings/CA"
                            >
                                California
                                <Image
                                    width={100}
                                    height={100}
                                    src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/web_graphics%2Fcali_shape.png?alt=media&token=a44401fd-8da3-43d5-9dbd-b5c19037b08a"
                                    alt="California shape"
                                    style={{ width: '100px', height: 'auto' }}
                                />
                            </Link>
                            <Link
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                href="/rankings/TX"
                            >
                                Texas
                                <Image
                                    width={100}
                                    height={100}
                                    src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/web_graphics%2Ftexas_shp.png?alt=media&token=6fe508db-5819-4e3f-8cd9-3f565f3f040e"
                                    alt="Texas shape"
                                    style={{ width: '100px', height: 'auto' }}
                                />
                            </Link>
                            <Link
                                style={{ display: 'flex', flexDirection: 'column' }}
                                href="/rankings/CO"
                            >
                                Colorado
                                <Image
                                    width={100}
                                    height={100}
                                    src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/web_graphics%2Fcoloradoi_shape.png?alt=media&token=c0d63748-65c6-4e2f-a004-98cccd65a9fb"
                                    alt="Colorado shape"
                                    style={{ width: '100px', height: 'auto' }}
                                />
                            </Link>
                        </div>
                        <Image
                            width={800}
                            height={200}
                            src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/web_graphics%2Frankings.png?alt=media&token=99a521db-1850-42eb-9152-7d0a9f0c3e65"
                            alt="Rankings"
                            style={{ width: '80%', height: 'auto' }}
                        />
                    </div>
                </div>
            )}
            <div className={styles.leftHeader}>
                <div className={styles.rules_btn} ref={rulesBtnRef}>
                    <Link href={`/rules`}>Rules</Link>
                </div>
                <div className={styles.awards_btn} ref={awardsBtnRef}>
                    <Link href={`/awards`}>Awards</Link>
                </div>
            </div>

            <div className={styles.logo_container}>
                <Link href="/" passHref>
                    <Image
                        src="/PMT_Logo_2021_wh.png"
                        alt="PMT Logo"
                        width={200}
                        height={100}
                        className="logo"
                        ref={logoRef}
                        style={{ width: 'auto', height: 'auto' }}
                    />
                </Link>
            </div>

            <div className={styles.rightHeader}>
                <div className={styles.rankings_btn} ref={rankingsBtnRef} onClick={toggleDropdown}>
                    Rankings
                </div>
                <div className={styles.gym_rankings_btn} ref={gymRankingsBtnRef}>
                    <Link href={`/results`}>Results</Link>
                </div>
            </div>
        </div>
    );
};

export default LandingHeader;