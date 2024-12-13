import React from 'react';
import Link from 'next/link';

const AdminHeader: React.FC = () => {
  return (
    <header className='adminHeader'>
      <nav>
        <ul className='navList'>
          <li>
            <Link href="/admin">
              Home
            </Link>
          </li>
          <li>
            <Link href="/admin/database2">
              Fighters
            </Link>
          </li>
          <li>
            <Link href="/admin/gyms">
              Gyms
            </Link>
          </li>
          <li>
            <Link href="/admin/addVideo">
              Video
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default AdminHeader;
