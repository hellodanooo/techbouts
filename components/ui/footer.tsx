import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer style={{paddingTop:'3%'}}>

<h3 style={{padding:'10px', borderRadius:'8px'}}>Find your Photos and Videos by following these pages</h3>

            <div style={{ display:'flex', justifyContent:'space-evenly', padding:'20px'}}>
                <a href="https://www.facebook.com/MuayThaiPurist/">
                    <img style={{width:'20vw', maxWidth:'100px'}} src="/mtp_facebook.png" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/muaythai_purist/">
                    <img style={{width:'20vw', maxWidth:'100px'}} src="/mtp_instagram.png" alt="Instagram" />
                </a>
                <a href="https://www.youtube.com/@muaythaipurist">
                    <img style={{width:'20vw', maxWidth:'100px'}} src="/mtp_youtube.png" alt="YouTube" />
                </a>
            </div>
        </footer>
    );
};

export default Footer;