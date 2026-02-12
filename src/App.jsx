import { useState, useEffect, useRef } from 'react';
import { fortunes } from './data/fortunes';
import fireworkSound from './assets/sounds/firework.mp3';
import firework5Sound from './assets/sounds/firework_5.mp3';
import fireworkSingleSound from './assets/sounds/single_firework.mp3';
import logo from './assets/Logo_Itech.svg';
import './App.css';

function App() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showModal, setShowModal] = useState(false);
  const [currentFortune, setCurrentFortune] = useState(null);
  const [canDraw, setCanDraw] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  // Countdown Timer
  useEffect(() => {
    const lunarNewYear = new Date('2026-02-17T00:00:00').getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = lunarNewYear - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Play firework sound
  const playFireworkSound = (type) => {
    if (!isSoundOn) return;
    
    try {
      let soundFile;
      // Chọn âm thanh dựa trên loại pháo hoa
      if (type === 'burst' || type === 'spiral' || type === 'fountain') {
        soundFile = firework5Sound; // Nổ 5 tiếng liên tục
      } else if (type === 'classic' || type === 'ring') {
        soundFile = fireworkSingleSound; // Nổ 1 tiếng bùm
      } else {
        soundFile = fireworkSound; // Tiếng nổ dài (heart, star, willow)
      }
      
      // Tạo audio instance mới mỗi lần để có thể phát nhiều âm thanh cùng lúc/liên tiếp
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Check fortune status
  useEffect(() => {
    const today = new Date().toDateString();
    const savedData = localStorage.getItem('fortuneData');

    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.date === today) {
        setCurrentFortune(data.fortune);
        setCanDraw(false);
      } else {
        setCanDraw(true);
        setCurrentFortune(null);
      }
    }
  }, []);

  // Fireworks Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let autoLaunchInterval = null;
    let isTabVisible = true;

    // Animation loop
    const animate = () => {
      if (!isTabVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = 'rgba(26, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => particle.alpha > 0);

      particlesRef.current.forEach(particle => {
        particle.velocity.y += particle.gravity;
        particle.velocity.x *= particle.friction;
        particle.velocity.y *= particle.friction;
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.alpha -= particle.fadeSpeed; // Sử dụng fadeSpeed riêng cho mỗi particle

        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        const size = particle.size || 3;
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Thêm glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start auto launch fireworks
    const startAutoLaunch = () => {
      if (autoLaunchInterval) clearInterval(autoLaunchInterval);
      autoLaunchInterval = setInterval(() => {
        if (isTabVisible) {
          const types = ['classic', 'burst', 'ring', 'heart', 'spiral', 'star', 'willow', 'fountain'];
          const randomType = types[Math.floor(Math.random() * types.length)];
          launchFirework(randomType);
        }
      }, 3000);
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      
      if (isTabVisible) {
        // Tab is visible again, resume
        startAutoLaunch();
      } else {
        // Tab is hidden, pause auto launch
        if (autoLaunchInterval) {
          clearInterval(autoLaunchInterval);
          autoLaunchInterval = null;
        }
        // Clear existing particles to prevent lag when coming back
        particlesRef.current = [];
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    animate();
    startAutoLaunch();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationRef.current);
      if (autoLaunchInterval) clearInterval(autoLaunchInterval);
    };
  }, []);

  const launchFirework = (type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.5 + 50;
    createFirework(x, y, type);
    if (isSoundOn) {
      playFireworkSound(type);
    }
  };

  const createFirework = (x, y, type) => {
    // Màu sắc realistic cho pháo hoa
    const colorSets = {
      red: ['#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc'],
      gold: ['#ffd700', '#ffed4e', '#fff9a6', '#ffffdd'],
      blue: ['#0066ff', '#3399ff', '#66ccff', '#99ddff'],
      green: ['#00ff00', '#66ff66', '#99ff99', '#ccffcc'],
      purple: ['#9933ff', '#b366ff', '#cc99ff', '#e6ccff'],
      white: ['#ffffff', '#ffffee', '#ffffdd']
    };
    
    const colorSetKeys = Object.keys(colorSets);
    const selectedSet = colorSets[colorSetKeys[Math.floor(Math.random() * colorSetKeys.length)]];
    
    let particleCount;
    switch(type) {
      case 'burst': particleCount = 150; break;
      case 'fountain': particleCount = 80; break;
      case 'ring': particleCount = 100; break;
      case 'heart': particleCount = 120; break;
      case 'spiral': particleCount = 180; break;
      case 'star': particleCount = 80; break;
      case 'willow': particleCount = 120; break;
      default: particleCount = 100;
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      let velocity;
      let trailLength = 0;
      let fadeSpeed;

      switch(type) {
        case 'burst':
          // Pháo hoa nổ tròn rực rỡ - chậm hơn
          const speed = Math.random() * 3 + 4; // Giảm từ 5+6 xuống 3+4
          velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          };
          trailLength = 5; // Tăng trail
          fadeSpeed = 0.004; // Tàn chậm hơn
          break;
        case 'fountain':
          // Pháo hoa phun lên như vòi nước - chậm hơn
          velocity = {
            x: (Math.random() - 0.5) * 2.5, // Giảm từ 4
            y: -Math.random() * 10 - 6 // Giảm từ 15+10
          };
          trailLength = 4; // Tăng trail
          fadeSpeed = 0.003;
          break;
        case 'ring':
          // Vòng tròn đều đặn - chậm hơn
          velocity = {
            x: Math.cos(angle) * 4.5, // Giảm từ 7
            y: Math.sin(angle) * 4.5
          };
          trailLength = 4;
          fadeSpeed = 0.004;
          break;
        case 'heart':
          // Hình trái tim - chậm hơn
          const t = (i / particleCount) * Math.PI * 2;
          const heartX = 16 * Math.pow(Math.sin(t), 3);
          const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
          velocity = { x: heartX * 0.25, y: heartY * 0.25 }; // Giảm từ 0.4
          trailLength = 4;
          fadeSpeed = 0.003;
          break;
        case 'spiral':
          // Xoắn ốc đẹp mắt - chậm hơn
          const spiralAngle = (i / particleCount) * Math.PI * 6;
          const spiralRadius = (i / particleCount) * 7; // Giảm từ 10
          velocity = {
            x: Math.cos(spiralAngle) * spiralRadius,
            y: Math.sin(spiralAngle) * spiralRadius
          };
          trailLength = 5;
          fadeSpeed = 0.004;
          break;
        case 'star':
          // Ngôi sao 5 cánh - chậm hơn
          const starPoints = 5;
          const starAngle = (i / (particleCount / starPoints)) * (Math.PI * 2 / starPoints);
          const isOuter = i % 2 === 0;
          const radius = isOuter ? 6 : 3; // Giảm từ 9:4
          velocity = {
            x: Math.cos(starAngle) * radius,
            y: Math.sin(starAngle) * radius
          };
          trailLength = 4;
          fadeSpeed = 0.003;
          break;
        case 'willow':
          // Pháo hoa dạng cây liễu rủ - chậm hơn
          velocity = {
            x: Math.cos(angle) * (Math.random() * 2.5 + 2), // Giảm từ 4+3
            y: Math.sin(angle) * (Math.random() * 2 + 1.5) + Math.random() * 3 // Giảm từ 3+2+4
          };
          trailLength = 6; // Tăng trail nhiều hơn
          fadeSpeed = 0.002; // Tàn rất chậm
          break;
        default:
          // Classic firework - chậm hơn
          velocity = {
            x: Math.cos(angle) * (Math.random() * 4 + 3), // Giảm từ 6+4
            y: Math.sin(angle) * (Math.random() * 4 + 3)
          };
          trailLength = 4;
          fadeSpeed = 0.004;
      }

      // Chọn màu từ set màu
      const color = selectedSet[Math.floor(Math.random() * selectedSet.length)];
      
      // Tạo particle với trail effect dài hơn
      for (let j = 0; j <= trailLength; j++) {
        particlesRef.current.push({
          x: x - velocity.x * j * 0.15, // Tăng spacing trail từ 0.1
          y: y - velocity.y * j * 0.15,
          color,
          velocity: { ...velocity },
          alpha: 1 - (j * 0.15), // Giảm fade rate từ 0.2
          gravity: 0.04, // Giảm gravity từ 0.08 để bay lâu hơn
          friction: 0.98, // Tăng friction từ 0.97 để giữ momentum lâu hơn
          size: 3 - j * 0.2, // Size giảm chậm hơn
          fadeSpeed: fadeSpeed // Fade speed riêng cho từng loại
        });
      }
    }
  };

  const drawFortune = () => {
    if (!canDraw) return;

    setIsDrawing(true);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * fortunes.length);
      const selectedFortune = fortunes[randomIndex];

      const today = new Date().toDateString();
      const fortuneData = {
        date: today,
        fortune: selectedFortune
      };
      localStorage.setItem('fortuneData', JSON.stringify(fortuneData));

      setCurrentFortune(selectedFortune);
      setCanDraw(false);
      setIsDrawing(false);

      // Launch celebration fireworks
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          launchFirework('heart');
        }, i * 200);
      }
    }, 1500);
  };

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div className="app">
      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">🎊 vào đêm giao thừa sẽ bắn pháo hoa 1 tiếng 🎊</span>
          <span className="ticker-item">🎊 vào đêm giao thừa sẽ bắn pháo hoa 1 tiếng 🎊</span>
        </div>
      </div>

      {/* Company Logo */}
      <div className="company-logo">
        <img src={logo} alt="iTech Logo" />
      </div>

      {/* Lantern Left */}
      <div className="lantern lantern-left">
        <div className="lantern-string"></div>
        <div className="lantern-top"></div>
        <div className="lantern-body"></div>
        <div className="lantern-bottom"></div>
      </div>

      {/* Sound Toggle Button */}
      <button 
        className="btn-sound-toggle" 
        onClick={() => setIsSoundOn(!isSoundOn)}
        title={isSoundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {isSoundOn ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        )}
      </button>

      {/* Main Container */}
      <div className="container">
        <h1 className="main-title">ĐÊM NGƯỢC TỚI</h1>
        <h2 className="year">2026</h2>
        <p className="subtitle">—— Năm Bính Ngọ ——</p>

        {/* Countdown */}
        <div className="countdown">
          <div className="time-item">
            <div className="time-box">
              <div className="time-value" key={countdown.days}>{pad(countdown.days)}</div>
            </div>
            <div className="time-label">NGÀY</div>
          </div>
          <div className="time-item">
            <div className="time-box">
              <div className="time-value" key={countdown.hours}>{pad(countdown.hours)}</div>
            </div>
            <div className="time-label">GIỞ</div>
          </div>
          <div className="time-item">
            <div className="time-box">
              <div className="time-value" key={countdown.minutes}>{pad(countdown.minutes)}</div>
            </div>
            <div className="time-label">PHÚT</div>
          </div>
          <div className="time-item">
            <div className="time-box">
              <div className="time-value" key={countdown.seconds}>{pad(countdown.seconds)}</div>
            </div>
            <div className="time-label">GIÂY</div>
          </div>
        </div>

        {/* Message */}
        <p className="message">
          Chúc bạn một năm mới an khang thịnh vượng, vạn sự như ý. Cả năm<br/>
          Bính Ngọ mã đáo thành công.
        </p>

        {/* Buttons */}
        <div className="action-buttons">
          <button className="btn btn-firework" onClick={() => launchFirework('classic')} title="Classic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('burst')} title="Burst">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <path d="M12 4V8M12 16V20M20 12H16M8 12H4M17.657 6.343L15.536 8.464M8.464 15.536L6.343 17.657M17.657 17.657L15.536 15.536M8.464 8.464L6.343 6.343" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('ring')} title="Ring">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('heart')} title="Heart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('star')} title="Star">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('spiral')} title="Spiral">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('fountain')} title="Fountain">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2V10M8 6L12 10L16 6M6 10L12 14L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="6" y="18" width="12" height="4" fill="currentColor"/>
            </svg>
          </button>
          <button className="btn btn-firework" onClick={() => launchFirework('willow')} title="Willow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 9 8 9 12C9 16 12 20 12 20M12 2C12 2 15 8 15 12C15 16 12 20 12 20M12 2V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="btn-divider"></div>
          <button className="btn btn-firework btn-launch-all" onClick={() => {
            const types = ['classic', 'burst', 'ring', 'heart', 'star', 'spiral', 'fountain', 'willow'];
            types.forEach((type, index) => {
              setTimeout(() => launchFirework(type), index * 200);
            });
          }} title="Phóng tất cả pháo hoa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z"/>
              <circle cx="6" cy="6" r="1.5"/>
              <circle cx="18" cy="6" r="1.5"/>
              <circle cx="6" cy="18" r="1.5"/>
              <circle cx="18" cy="18" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Fortune Button - Fixed Right Bottom */}
      <button className="btn-fortune-fixed" onClick={() => setShowModal(true)} title="Gieo quẻ">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Bagua - 8 trigrams around circle */}
          <circle cx="32" cy="32" r="28" stroke="#d4af37" strokeWidth="2" fill="none"/>
          <circle cx="32" cy="32" r="22" stroke="#d4af37" strokeWidth="1" fill="none"/>
          {/* Yin Yang center */}
          <path d="M32 10 A22 22 0 0 1 32 54 A11 11 0 0 0 32 32 A11 11 0 0 1 32 10" fill="#d4af37"/>
          <circle cx="32" cy="21" r="3" fill="#1a0000"/>
          <circle cx="32" cy="43" r="3" fill="#d4af37"/>
          {/* Trigrams */}
          <line x1="32" y1="2" x2="32" y2="6" stroke="#d4af37" strokeWidth="2.5"/>
          <line x1="32" y1="8" x2="32" y2="10" stroke="#d4af37" strokeWidth="2.5"/>
          <line x1="32" y1="12" x2="32" y2="14" stroke="#d4af37" strokeWidth="2.5"/>
        </svg>
        <span className="fortune-label">GIEO QUẺ</span>
      </button>

      {/* Lantern Right */}
      <div className="lantern lantern-right">
        <div className="lantern-string"></div>
        <div className="lantern-top"></div>
        <div className="lantern-body"></div>
        <div className="lantern-bottom"></div>
      </div>

      {/* Fireworks Canvas */}
      <canvas ref={canvasRef} id="fireworksCanvas"></canvas>

      {/* Fortune Modal */}
      {showModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2 className="modal-title">GIEO QUẺ ĐẦU NĂM</h2>
            
            {canDraw && !currentFortune ? (
              <div id="fortuneResult">
                <p className="fortune-intro">Hãy bấm nút bên dưới để gieo quẻ và nhận lời chúc may mắn cho năm mới!</p>
                <button 
                  className="btn-draw" 
                  onClick={drawFortune}
                  disabled={isDrawing}
                >
                  {isDrawing ? 'ĐANG GIEO QUẺ...' : 'GIEO QUẺ'}
                </button>
              </div>
            ) : (
              <div id="fortuneDisplay">
                <div className="fortune-card">
                  <h3 id="fortuneTitle">{currentFortune?.title}</h3>
                  <p id="fortuneMessage">{currentFortune?.message}</p>
                  {currentFortune?.meaning && (
                    <p className="fortune-meaning">{currentFortune.meaning}</p>
                  )}
                  <p className="fortune-note">✨ Bạn đã gieo quẻ hôm nay. Hẹn gặp lại bạn vào ngày mai! ✨</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
