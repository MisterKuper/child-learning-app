import React, { useEffect, useState } from 'react'
import HeaderHome from '../../components/HeaderHome/HeaderHome'
import UnitLayout from '../../components/UnitLayout/UnitLayout'
import { syncUserProgress } from '../../utils/progressUtils'
import { useParams } from 'react-router-dom'

const Home = () => {
  const { userId } = useParams();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (userId) {
      syncUserProgress(userId);
    }
  }, [userId]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div>
      <HeaderHome visible={showHeader} />
      <div style={{ paddingTop: '70px' }}>
        <UnitLayout />
      </div>
    </div>
  )
}

export default Home;
