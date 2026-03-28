import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TravelMap from './TravelMap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  weather?: WeatherData | null;
  mapInfo?: MapInfo | null;
  images?: string[];
  itinerary?: ItineraryDay[] | null;
}

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  description: string;
  humidity: number;
  icon: string;
}

interface MapInfo {
  lat: number;
  lng: number;
  name: string;
}

interface ItineraryDay {
  day: string;
  items: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  { label: '🗼 도쿄 추천', text: '도쿄에서 꼭 가봐야 할 여행지 추천해줘' },
  { label: '🌸 교토 여행', text: '교토 3박 4일 여행 일정 짜줘' },
  { label: '🏝️ 발리 정보', text: '발리 여행 정보 알려줘' },
  { label: '🗽 뉴욕 명소', text: '뉴욕 유명한 관광지 알려줘' },
  { label: '🌊 제주도', text: '제주도 2박 3일 여행 일정 짜줘' },
  { label: '🏯 경주 여행', text: '경주 여행 코스 추천해줘' },
  { label: '🥘 파리 맛집', text: '파리 현지 맛집 추천해줘' },
  { label: '🎡 방콕 명소', text: '방콕 여행지 추천해줘' },
];

const CATEGORIES = [
  { icon: '🌏', label: '아시아' },
  { icon: '🌍', label: '유럽' },
  { icon: '🌎', label: '아메리카' },
  { icon: '🏖️', label: '국내' },
  { icon: '🗺️', label: '오세아니아' },
  { icon: '🌅', label: '중동/아프리카' },
];

// 여행지 → 좌표 매핑
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // 국내
  서울: { lat: 37.5665, lng: 126.9780 }, 부산: { lat: 35.1796, lng: 129.0756 },
  인천: { lat: 37.4563, lng: 126.7052 }, 대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 }, 대전: { lat: 36.3504, lng: 127.3845 },
  제주도: { lat: 33.4996, lng: 126.5312 }, 경주: { lat: 35.8562, lng: 129.2247 },
  전주: { lat: 35.8242, lng: 127.1480 }, 강릉: { lat: 37.7519, lng: 128.8761 },
  속초: { lat: 38.2070, lng: 128.5918 }, 여수: { lat: 34.7604, lng: 127.6622 },
  춘천: { lat: 37.8813, lng: 127.7298 }, 수원: { lat: 37.2636, lng: 127.0286 },
  // 일본
  도쿄: { lat: 35.6762, lng: 139.6503 }, 오사카: { lat: 34.6937, lng: 135.5023 },
  교토: { lat: 35.0116, lng: 135.7681 }, 삿포로: { lat: 43.0618, lng: 141.3545 },
  후쿠오카: { lat: 33.5904, lng: 130.4017 }, 나고야: { lat: 35.1815, lng: 136.9066 },
  오키나와: { lat: 26.2124, lng: 127.6809 }, 나라: { lat: 34.6851, lng: 135.8049 },
  // 동남아
  방콕: { lat: 13.7563, lng: 100.5018 }, 발리: { lat: -8.3405, lng: 115.0920 },
  싱가포르: { lat: 1.3521, lng: 103.8198 }, 하노이: { lat: 21.0285, lng: 105.8542 },
  호치민: { lat: 10.8231, lng: 106.6297 }, 다낭: { lat: 16.0544, lng: 108.2022 },
  쿠알라룸푸르: { lat: 3.1390, lng: 101.6869 }, 세부: { lat: 10.3157, lng: 123.8854 },
  치앙마이: { lat: 18.7883, lng: 98.9853 }, 푸켓: { lat: 7.8804, lng: 98.3923 },
  // 중국
  베이징: { lat: 39.9042, lng: 116.4074 }, 상하이: { lat: 31.2304, lng: 121.4737 },
  홍콩: { lat: 22.3193, lng: 114.1694 }, 마카오: { lat: 22.1987, lng: 113.5439 },
  청두: { lat: 30.5728, lng: 104.0668 }, 시안: { lat: 34.3416, lng: 108.9398 },
  // 유럽
  파리: { lat: 48.8566, lng: 2.3522 }, 런던: { lat: 51.5074, lng: -0.1278 },
  로마: { lat: 41.9028, lng: 12.4964 }, 바르셀로나: { lat: 41.3851, lng: 2.1734 },
  암스테르담: { lat: 52.3676, lng: 4.9041 }, 베를린: { lat: 52.5200, lng: 13.4050 },
  빈: { lat: 48.2082, lng: 16.3738 }, 프라하: { lat: 50.0755, lng: 14.4378 },
  취리히: { lat: 47.3769, lng: 8.5417 }, 제네바: { lat: 46.2044, lng: 6.1432 },
  뮌헨: { lat: 48.1351, lng: 11.5820 }, 부다페스트: { lat: 47.4979, lng: 19.0402 },
  바르샤바: { lat: 52.2297, lng: 21.0122 }, 마드리드: { lat: 40.4168, lng: -3.7038 },
  리스본: { lat: 38.7223, lng: -9.1393 }, 아테네: { lat: 37.9838, lng: 23.7275 },
  이스탄불: { lat: 41.0082, lng: 28.9784 }, 두브로브니크: { lat: 42.6507, lng: 18.0944 },
  스톡홀름: { lat: 59.3293, lng: 18.0686 }, 코펜하겐: { lat: 55.6761, lng: 12.5683 },
  헬싱키: { lat: 60.1699, lng: 24.9384 }, 오슬로: { lat: 59.9139, lng: 10.7522 },
  밀라노: { lat: 45.4654, lng: 9.1859 }, 베네치아: { lat: 45.4408, lng: 12.3155 },
  // 중동/아프리카
  두바이: { lat: 25.2048, lng: 55.2708 }, 아부다비: { lat: 24.4539, lng: 54.3773 },
  카이로: { lat: 30.0444, lng: 31.2357 }, 마라케시: { lat: 31.6295, lng: -7.9811 },
  // 오세아니아
  시드니: { lat: -33.8688, lng: 151.2093 }, 멜버른: { lat: -37.8136, lng: 144.9631 },
  브리즈번: { lat: -27.4698, lng: 153.0251 }, 오클랜드: { lat: -36.8485, lng: 174.7633 },
  퀸스타운: { lat: -45.0312, lng: 168.6626 },
  // 아메리카
  뉴욕: { lat: 40.7128, lng: -74.0060 }, 로스앤젤레스: { lat: 34.0522, lng: -118.2437 },
  샌프란시스코: { lat: 37.7749, lng: -122.4194 }, 라스베이거스: { lat: 36.1699, lng: -115.1398 },
  시카고: { lat: 41.8781, lng: -87.6298 }, 마이애미: { lat: 25.7617, lng: -80.1918 },
  밴쿠버: { lat: 49.2827, lng: -123.1207 }, 토론토: { lat: 43.6532, lng: -79.3832 },
  호놀룰루: { lat: 21.3069, lng: -157.8583 }, 칸쿤: { lat: 21.1619, lng: -86.8515 },
  리우데자네이루: { lat: -22.9068, lng: -43.1729 }, 부에노스아이레스: { lat: -34.6037, lng: -58.3816 },
  // 남아시아
  뭄바이: { lat: 19.0760, lng: 72.8777 }, 뉴델리: { lat: 28.6139, lng: 77.2090 },
  카트만두: { lat: 27.7172, lng: 85.3240 },
};

// 여행지 → Unsplash 키워드 매핑
const CITY_IMAGE_KEYWORDS: Record<string, string> = {
  서울: 'seoul', 부산: 'busan', 제주도: 'jeju', 교토: 'kyoto', 도쿄: 'tokyo',
  오사카: 'osaka', 파리: 'paris', 런던: 'london', 로마: 'rome', 뉴욕: 'new-york',
  방콕: 'bangkok', 발리: 'bali', 싱가포르: 'singapore', 두바이: 'dubai',
  시드니: 'sydney', 바르셀로나: 'barcelona', 프라하: 'prague', 이스탄불: 'istanbul',
  홍콩: 'hong-kong', 빈: 'vienna', 암스테르담: 'amsterdam', 경주: 'gyeongju',
  여수: 'yeosu', 강릉: 'gangneung', 속초: 'sokcho', 전주: 'jeonju',
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

// 메시지에서 여행지 감지
const detectCity = (text: string): string | null => {
  for (const city of Object.keys(CITY_COORDS)) {
    if (text.includes(city)) return city;
  }
  return null;
};

// 메시지에서 이미지 키워드 감지
const detectImageCities = (text: string): string[] => {
  return Object.keys(CITY_IMAGE_KEYWORDS).filter((city) => text.includes(city)).slice(0, 3);
};

// 여행 일정 파싱 (1일차 / Day 1 형태)
const parseItinerary = (text: string): ItineraryDay[] | null => {
  const dayPattern = /(?:(\d+)일차|Day\s*(\d+))[^\n]*\n([\s\S]*?)(?=(?:\d+일차|Day\s*\d+)|$)/gi;
  const days: ItineraryDay[] = [];
  let match;
  while ((match = dayPattern.exec(text)) !== null) {
    const dayNum = match[1] || match[2];
    const content = match[3].trim();
    const items = content
      .split('\n')
      .filter(l => /^[-*•]\s/.test(l.trim()))  // 불릿 항목만 허용
      .map(l => {
        const cleaned = l.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
        const colonIdx = cleaned.indexOf(':');
        return colonIdx > 0 ? cleaned.slice(0, colonIdx).trim() : cleaned;
      })
      .filter(item => item.length > 2)
      .filter(item => !/[^\u0000-\u007F\uAC00-\uD7A3\u3131-\u318E\s]/.test(item)); // 외국어 포함 항목 제거
    if (items.length > 0) days.push({ day: `${dayNum}일차`, items });
  }
  return days.length >= 2 ? days : null;
};

// sessionStorage
const loadConversations = (): Conversation[] => {
  try { return JSON.parse(sessionStorage.getItem('travel_conversations') || '[]'); } catch { return []; }
};
const saveConversations = (convs: Conversation[]) =>
  sessionStorage.setItem('travel_conversations', JSON.stringify(convs));

// OpenWeatherMap 도시명 (한국어 → 영문)
const CITY_EN: Record<string, string> = {
  // 국내
  서울: 'Seoul', 부산: 'Busan', 인천: 'Incheon', 대구: 'Daegu',
  광주: 'Gwangju', 대전: 'Daejeon', 제주도: 'Jeju', 경주: 'Gyeongju',
  전주: 'Jeonju', 강릉: 'Gangneung', 속초: 'Sokcho', 여수: 'Yeosu',
  춘천: 'Chuncheon', 수원: 'Suwon',
  // 일본
  도쿄: 'Tokyo', 오사카: 'Osaka', 교토: 'Kyoto', 삿포로: 'Sapporo',
  후쿠오카: 'Fukuoka', 나고야: 'Nagoya', 오키나와: 'Naha', 나라: 'Nara',
  // 동남아
  방콕: 'Bangkok', 발리: 'Denpasar', 싱가포르: 'Singapore',
  하노이: 'Hanoi', 호치민: 'Ho Chi Minh City', 다낭: 'Da Nang',
  쿠알라룸푸르: 'Kuala Lumpur', 세부: 'Cebu', 치앙마이: 'Chiang Mai', 푸켓: 'Phuket',
  // 중국
  베이징: 'Beijing', 상하이: 'Shanghai', 홍콩: 'Hong Kong',
  마카오: 'Macau', 청두: 'Chengdu', 시안: 'Xian',
  // 유럽
  파리: 'Paris', 런던: 'London', 로마: 'Rome', 바르셀로나: 'Barcelona',
  암스테르담: 'Amsterdam', 베를린: 'Berlin', 빈: 'Vienna', 프라하: 'Prague',
  취리히: 'Zurich', 제네바: 'Geneva', 뮌헨: 'Munich', 부다페스트: 'Budapest',
  바르샤바: 'Warsaw', 마드리드: 'Madrid', 리스본: 'Lisbon', 아테네: 'Athens',
  이스탄불: 'Istanbul', 두브로브니크: 'Dubrovnik', 스톡홀름: 'Stockholm',
  코펜하겐: 'Copenhagen', 헬싱키: 'Helsinki', 오슬로: 'Oslo',
  밀라노: 'Milan', 베네치아: 'Venice',
  // 중동/아프리카
  두바이: 'Dubai', 아부다비: 'Abu Dhabi', 카이로: 'Cairo', 마라케시: 'Marrakesh',
  // 오세아니아
  시드니: 'Sydney', 멜버른: 'Melbourne', 브리즈번: 'Brisbane',
  오클랜드: 'Auckland', 퀸스타운: 'Queenstown',
  // 아메리카
  뉴욕: 'New York', 로스앤젤레스: 'Los Angeles', 샌프란시스코: 'San Francisco',
  라스베이거스: 'Las Vegas', 시카고: 'Chicago', 마이애미: 'Miami',
  밴쿠버: 'Vancouver', 토론토: 'Toronto', 호놀룰루: 'Honolulu', 칸쿤: 'Cancun',
  리우데자네이루: 'Rio de Janeiro', 부에노스아이레스: 'Buenos Aires',
  // 남아시아
  뭄바이: 'Mumbai', 뉴델리: 'New Delhi', 카트만두: 'Kathmandu',
};

// ─── 여행 일정표 + PDF 다운로드 ───────────────────────────────────────────────
const ItineraryCard: React.FC<{ itinerary: ItineraryDay[] }> = ({ itinerary }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1e1b4b',
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        // 내용이 길면 여러 페이지로 분할
        let y = 0;
        while (y < canvas.height) {
          const sliceHeight = Math.min((pageHeight - 20) * (canvas.width / imgWidth), canvas.height - y);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext('2d');
          ctx?.drawImage(canvas, 0, -y);
          const sliceData = sliceCanvas.toDataURL('image/png');
          if (y > 0) pdf.addPage();
          pdf.addImage(sliceData, 'PNG', 10, 10, imgWidth, sliceHeight * imgWidth / canvas.width);
          y += sliceHeight;
        }
      }

      pdf.save(`여행일정표_${new Date().toLocaleDateString('ko-KR').replace(/\s|\./g, '_')}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-3 w-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
      {/* 헤더 */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.25)' }}>
        <p className="text-white text-xs font-semibold">📅 여행 일정표</p>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          style={{ background: downloading ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.5)', color: 'white', cursor: downloading ? 'not-allowed' : 'pointer' }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = 'rgba(99,102,241,0.8)'; }}
          onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = 'rgba(99,102,241,0.5)'; }}
        >
          {downloading ? (
            <><span className="animate-spin">⏳</span><span>저장 중...</span></>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg><span>PDF 저장</span></>
          )}
        </button>
      </div>

      {/* 일정 내용 (PDF 캡처 대상) */}
      <div ref={cardRef} style={{ background: '#1e1b4b', padding: '16px' }}>
        <p style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>📅 여행 일정표</p>
        {itinerary.map((day, di) => (
          <div key={di} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderTop: di > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            <span style={{ flexShrink: 0, width: '52px', textAlign: 'center', padding: '2px 0', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {day.day}
            </span>
            <ul style={{ flex: 1, listStyle: 'none', margin: 0, padding: 0 }}>
              {day.items.map((item, ii) => (
                <li key={ii} style={{ color: '#d1d5db', fontSize: '12px', marginBottom: '4px', display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#818cf8', flexShrink: 0 }}>▸</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 메시지 아이템 (memo로 감싸서 스트리밍 중 이전 메시지 리렌더링 방지) ──────────
const MessageItem = memo(({ msg, idx, copiedIdx, onCopy }: {
  msg: Message;
  idx: number;
  copiedIdx: number | null;
  onCopy: (content: string, idx: number) => void;
}) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 group`}>
    {msg.role === 'assistant' && (
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <span className="text-white">AI</span>
      </div>
    )}

    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
      <div className="px-5 py-3.5 rounded-2xl text-sm leading-relaxed"
        style={msg.role === 'user'
          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderBottomRightRadius: '4px' }
          : { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderBottomLeftRadius: '4px' }}>
        {msg.role === 'assistant' && msg.content === '' ? (
          <div className="flex space-x-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : msg.role === 'assistant' ? (
          !msg.itinerary && (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse">{children}</table></div>,
                th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold border" style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(99,102,241,0.3)' }}>{children}</th>,
                td: ({ children }) => <td className="px-3 py-1.5 border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{children}</td>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                li: ({ children }) => <li className="text-gray-200">{children}</li>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-indigo-300 mt-2 mb-1">{children}</h3>,
                code: ({ children }) => <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(0,0,0,0.3)', color: '#a5b4fc' }}>{children}</code>,
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )
        ) : (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        )}
      </div>

      {msg.weather && (
        <div className="mt-3 px-4 py-3 rounded-2xl flex items-center gap-4 w-full"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <img src={`https://openweathermap.org/img/wn/${msg.weather.icon}@2x.png`} alt="weather" className="w-12 h-12" />
          <div>
            <p className="text-white text-sm font-semibold">{msg.weather.city} 현재 날씨</p>
            <p className="text-indigo-300 text-xs">{msg.weather.description} · {msg.weather.temp}°C (체감 {msg.weather.feels_like}°C)</p>
            <p className="text-gray-400 text-xs">습도 {msg.weather.humidity}%</p>
          </div>
        </div>
      )}

      {msg.images && msg.images.length > 0 && (
        <div className={`mt-3 grid gap-2 w-full ${msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {msg.images.map((src, i) => (
            <img key={i} src={src} alt="travel" className="rounded-2xl object-cover w-full"
              style={{ height: '160px', border: '1px solid rgba(255,255,255,0.1)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ))}
        </div>
      )}

      {msg.itinerary && msg.itinerary.length > 0 && (
        <ItineraryCard itinerary={msg.itinerary} />
      )}

      {msg.mapInfo && (
        <div className="mt-3 w-full">
          <TravelMap lat={msg.mapInfo.lat} lng={msg.mapInfo.lng} name={msg.mapInfo.name} />
        </div>
      )}

      <div className={`flex items-center gap-2 mt-1.5 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
        {msg.role === 'assistant' && (
          <button onClick={() => onCopy(msg.content, idx)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.08)', color: copiedIdx === idx ? '#86efac' : '#9ca3af' }}>
            {copiedIdx === idx ? <><span>✓</span><span>복사됨</span></> : (
              <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>복사</span></>
            )}
          </button>
        )}
      </div>
    </div>

    {msg.role === 'user' && (
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: 'rgba(255,255,255,0.1)' }}>
        <span className="text-lg">👤</span>
      </div>
    )}
  </div>
));

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'quick' | 'history'>('quick');
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [currentConvId, setCurrentConvId] = useState<string>('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string>(`user_${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 || !currentConvId) return;
    setConversations((prev) => {
      const updated = prev.map((c) => c.id === currentConvId ? { ...c, messages } : c);
      saveConversations(updated);
      return updated;
    });
  }, [messages, currentConvId]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    const newId = `conv_${Date.now()}`;
    setCurrentConvId(newId);
    sessionId.current = `user_${Date.now()}`;
  }, []);

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setCurrentConvId(conv.id);
    sessionId.current = `user_${conv.id}`;
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (currentConvId === id) startNewConversation();
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const exportChat = () => {
    const text = messages
      .map((m) => `[${m.role === 'user' ? '나' : 'AI'}] ${formatTime(m.timestamp)}\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `여행가이드_대화_${new Date().toLocaleDateString('ko-KR').replace(/\s|\./g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchWeather = async (cityKo: string): Promise<WeatherData | null> => {
    const cityEn = CITY_EN[cityKo];
    if (!cityEn) return null;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/weather/${encodeURIComponent(cityEn)}`);
      if (res.data.error) return null;
      return res.data;
    } catch { return null; }
  };

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    if (messages.length === 0) {
      const newId = currentConvId || `conv_${Date.now()}`;
      setCurrentConvId(newId);
      const newConv: Conversation = {
        id: newId,
        title: trimmed.slice(0, 30) + (trimmed.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
      };
      setConversations((prev) => { const u = [newConv, ...prev]; saveConversations(u); return u; });
    }

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, session_id: sessionId.current }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data === '[DONE]') break;
              fullContent += data;
              // 스트리밍 중엔 별도 state만 업데이트 → 이전 메시지 리렌더링 없음
              setStreamingContent(fullContent);
            }
          }
        }
      }

      // 스트리밍 완료 후 부가 정보 조회
      const detectedCity = detectCity(trimmed);
      const imageCities = detectImageCities(trimmed + ' ' + fullContent);
      const itinerary = parseItinerary(fullContent);
      const weather = detectedCity ? await fetchWeather(detectedCity) : null;
      const mapInfo = detectedCity && CITY_COORDS[detectedCity]
        ? { ...CITY_COORDS[detectedCity], name: detectedCity }
        : null;
      const images = imageCities.map(
        (city) => `https://source.unsplash.com/400x250/?${CITY_IMAGE_KEYWORDS[city]},travel`
      );

      // 완성된 메시지를 messages에 추가, streamingContent 초기화
      const completedMsg: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        weather,
        mapInfo,
        images: images.length > 0 ? images : undefined,
        itinerary,
      };
      setMessages((prev) => [...prev, completedMsg]);
      setStreamingContent('');
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      }]);
      setStreamingContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>

      {/* ── 사이드바 ── */}
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="w-64 h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

          {/* 로고 영역 */}
          <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>✈️</div>
              <div>
                <h1 className="text-white font-bold text-sm leading-tight">AI Travel Guide</h1>
                <p className="text-indigo-400 text-xs mt-0.5">301개 여행지 · RAG 기반</p>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="px-4 pt-4">
            <div className="flex rounded-xl p-1 mb-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
              {(['quick', 'history'] as const).map((tab) => (
                <button key={tab} onClick={() => setSidebarTab(tab)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{ background: sidebarTab === tab ? 'rgba(99,102,241,0.7)' : 'transparent', color: sidebarTab === tab ? 'white' : '#6b7280' }}>
                  {tab === 'quick' ? '🗺️ 탐색' : '💬 기록'}
                </button>
              ))}
            </div>
          </div>

          {/* 빠른 질문 탭 */}
          {sidebarTab === 'quick' && (
            <div className="flex-1 px-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {/* 지역별 탐색 - 2열 그리드 */}
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">지역별 탐색</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CATEGORIES.map((cat) => (
                  <button key={cat.label} onClick={() => sendMessage(`${cat.label} 여행지 추천해줘`)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs text-gray-300 hover:text-white transition-all duration-200 border"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* 추천 질문 - pill 태그 형태 */}
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">추천 질문</p>
              <div className="flex flex-wrap gap-2 pb-4">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q.label} onClick={() => sendMessage(q.text)}
                    className="px-3 py-1.5 rounded-full text-xs text-gray-300 hover:text-white transition-all duration-200 border"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.35)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 대화 기록 탭 */}
          {sidebarTab === 'history' && (
            <div className="flex-1 px-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {conversations.length === 0 ? (
                <div className="text-center text-gray-600 text-xs mt-10">
                  <p className="text-3xl mb-3">💬</p>
                  <p>아직 대화 기록이 없어요</p>
                  <p className="mt-1 text-gray-700">새 대화를 시작해보세요</p>
                </div>
              ) : (
                <div className="space-y-1.5 pb-4">
                  {conversations.slice(0, 20).map((conv) => (
                    <button key={conv.id} onClick={() => loadConversation(conv)}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-all group relative"
                      style={{ background: currentConvId === conv.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)', border: `1px solid ${currentConvId === conv.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}` }}
                      onMouseEnter={e => { if (currentConvId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={e => { if (currentConvId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                      <p className="text-gray-200 text-xs font-medium truncate pr-5 leading-relaxed">{conv.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{formatDate(conv.createdAt)} · {conv.messages.length}개</p>
                      <span onClick={(e) => deleteConversation(conv.id, e)}
                        className="absolute right-2.5 top-2.5 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 하단 */}
          <div className="px-4 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={startNewConversation}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 대화 시작
            </button>
          </div>
        </div>
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-white font-semibold text-sm">AI 여행 가이드</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-green-400 text-xs">온라인</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={exportChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white transition-all border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                대화 저장
              </button>
            )}
            <span className="text-gray-500 text-xs">{messages.length > 0 ? `${messages.length}개의 메시지` : '새 대화'}</span>
          </div>
        </div>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-6 p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                <p className="text-6xl mb-4">🌍</p>
                <h3 className="text-white text-xl font-bold mb-2">어디로 떠나볼까요?</h3>
                <p className="text-gray-400 text-sm">여행지, 맛집, 코스, 일정 등 무엇이든 물어보세요</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button key={q.label} onClick={() => sendMessage(q.text)}
                    className="px-4 py-3 rounded-2xl text-sm text-gray-300 hover:text-white text-left transition-all border"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageItem key={idx} msg={msg} idx={idx} copiedIdx={copiedIdx} onCopy={copyMessage} />
          ))}

          {/* 스트리밍 중인 메시지 - 별도 렌더링으로 이전 메시지 리렌더링 방지 */}
          {loading && (
            <div className="flex justify-start gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <span className="text-white">AI</span>
              </div>
              <div className="max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderBottomLeftRadius: '4px' }}>
                {streamingContent === '' ? (
                  <div className="flex space-x-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-200">{children}</li>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    }}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}


          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <div className="flex-shrink-0 px-6 py-4"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center rounded-2xl px-5 py-3 gap-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-gray-400">✈️</span>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="여행지나 여행 관련 질문을 입력하세요..." disabled={loading}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            </div>
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: (!input.trim() || loading) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-gray-600 text-xs mt-2">Enter 키로 전송 · 301개 여행지 데이터 기반</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
