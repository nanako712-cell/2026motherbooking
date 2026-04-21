import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Camera, 
  Flower2, 
  Check,
  Mail,
  ArrowRight,
  MessageSquare,
  CreditCard,
  MessageCircle,
  Settings,
  X,
  Trash2,
  AlertCircle,
  Lock
} from 'lucide-react';

// --- Firebase 配置 ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 修正路徑段數：替換斜線避免 Firestore 路徑錯誤
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'nako-mothers-day-2026';
const sanitizedAppId = rawAppId.replace(/\//g, '_');

// --- 常數設定 ---
const DATES = ['2026-05-08', '2026-05-09', '2026-05-10'];
const TIME_SLOTS = [
  '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
  '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00',
  '15:00-15:30', '15:30-16:00'
];
const LINE_OFFICIAL_URL = "https://line.me/ti/p/@172qcdxw"; 
const ADMIN_PASSWORD = "nako2026"; 

// --- 子組件：管理員登入 ---
const AdminLoginView = ({ adminPassInput, setAdminPassInput, handleAdminLogin, setView }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]">
    <div className="bg-white p-10 border border-stone-100 shadow-sm max-w-sm w-full text-center">
      <Lock className="w-8 h-8 text-stone-200 mx-auto mb-6" />
      <h3 className="font-serif text-xl mb-6 font-medium">管理員驗證</h3>
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <input 
          type="password"
          autoFocus
          value={adminPassInput}
          onChange={(e) => setAdminPassInput(e.target.value)}
          className="w-full border-b border-stone-200 py-3 text-center outline-none focus:border-stone-800 transition-colors bg-transparent"
          placeholder="ENTER PASSWORD"
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => setView('booking')} className="flex-1 text-[10px] tracking-widest uppercase text-stone-300 py-4">Cancel</button>
          <button type="submit" className="flex-1 bg-stone-800 text-white text-[10px] tracking-widest uppercase py-4">Verify</button>
        </div>
      </form>
    </div>
  </div>
);

// --- 子組件：後台管理清單 ---
const AdminView = ({ bookedSlots, setView, deleteConfirmId, setDeleteConfirmId, handleDelete }) => (
  <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500">
    <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-6">
      <h2 className="font-serif text-3xl tracking-tight text-stone-800">預約清單管理</h2>
      <button onClick={() => setView('booking')} className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors text-xs uppercase tracking-widest">
        <X className="w-4 h-4" /> 關閉後台
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.2em] text-stone-400 text-left border-b border-stone-100 font-sans">
            <th className="py-4 font-normal">預約時段</th>
            <th className="py-4 font-normal">客戶資料</th>
            <th className="py-4 font-normal">加人 / 花束</th>
            <th className="py-4 font-normal">備註 / 需求</th>
            <th className="py-4 font-normal text-right">操作</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {[...bookedSlots].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((booking) => (
            <tr key={booking.id} className="border-b border-stone-50 group hover:bg-stone-50 transition-colors">
              <td className="py-6 pr-8 align-top">
                <div className="font-medium text-stone-800 font-sans">{booking.date}</div>
                <div className="text-stone-400 text-xs mt-1 font-sans">{booking.time}</div>
              </td>
              <td className="py-6 pr-8 align-top">
                <div className="text-stone-800 font-medium mb-1 font-serif">{booking.name}</div>
                <div className="text-stone-400 text-xs font-sans">{booking.phone}</div>
                <div className="text-stone-400 text-xs mt-1 truncate max-w-[150px] font-sans">{booking.email}</div>
              </td>
              <td className="py-6 pr-8 align-top">
                <div className="text-stone-600 text-xs font-sans">+{booking.extraPeople} 人</div>
                <div className={`text-xs mt-1 ${booking.bouquetUpgrade ? 'text-[#D4A373] font-medium' : 'text-stone-300'}`}>
                  {booking.bouquetUpgrade ? '升級加大花束' : '基本花束'}
                </div>
              </td>
              <td className="py-6 pr-8 align-top italic text-stone-500 text-xs leading-relaxed max-w-xs break-words">{booking.note || "無"}</td>
              <td className="py-6 align-top text-right">
                {deleteConfirmId === booking.id ? (
                  <div className="flex flex-col items-end gap-1 animate-in zoom-in">
                    <button onClick={() => handleDelete(booking.id)} className="bg-red-500 text-white px-3 py-1 text-[10px] uppercase">確認刪除</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="text-stone-300 text-[10px] uppercase">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(booking.id)} className="text-stone-200 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                )}
              </td>
            </tr>
          ))}
          {bookedSlots.length === 0 && (
            <tr><td colSpan="5" className="py-20 text-center text-stone-300 text-xs tracking-widest italic">目前尚無預約資料</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- 主應用程式 ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('booking'); 
  const [adminPassInput, setAdminPassInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [extraPeople, setExtraPeople] = useState(0);
  const [bouquetUpgrade, setBouquetUpgrade] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', sanitizedAppId, 'public', 'data', 'bookings');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookedSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Firestore Error:", error));
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime || !name || !phone || !email) return;
    setIsSubmitting(true);
    try {
      const bookingId = `${selectedDate}_${selectedTime.replace(':', '')}`;
      await setDoc(doc(db, 'artifacts', sanitizedAppId, 'public', 'data', 'bookings', bookingId), {
        date: selectedDate, time: selectedTime, name, phone, email, extraPeople, bouquetUpgrade, note,
        timestamp: new Date().toISOString(), userId: user.uid
      });
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', sanitizedAppId, 'public', 'data', 'bookings', id));
      setDeleteConfirmId(null);
    } catch (err) { console.error(err); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_PASSWORD) { setView('admin'); setAdminPassInput(''); }
    else { alert("密碼錯誤"); }
  };

  if (view === 'admin_login') return <AdminLoginView adminPassInput={adminPassInput} setAdminPassInput={setAdminPassInput} handleAdminLogin={handleAdminLogin} setView={setView} />;
  if (view === 'admin') return <AdminView bookedSlots={bookedSlots} setView={setView} deleteConfirmId={deleteConfirmId} setDeleteConfirmId={setDeleteConfirmId} handleDelete={handleDelete} />;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A4441] font-light">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@200;400;500&family=Outfit:wght@200;300;400&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .font-serif { font-family: 'Noto Serif TC', serif; }
        .admin-trigger { opacity: 0.05; transition: opacity 0.3s; cursor: pointer; }
        .admin-trigger:hover { opacity: 0.5; }
      `}</style>

      <header className="border-b border-stone-100 py-16 px-6 text-center">
        <p className="uppercase tracking-[0.4em] text-[10px] text-stone-400 mb-4 font-sans">Limited Availability</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-6 tracking-tight text-stone-800 uppercase">2026 Mother's Day <br className="md:hidden" /> Mini Session</h1>
        <div className="h-12 w-[1px] bg-stone-200 mx-auto"></div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 space-y-12">
          <section>
            <h2 className="font-serif text-2xl mb-8 border-l border-stone-300 pl-6 text-stone-800 font-medium">方案內容</h2>
            <div className="space-y-8">
              <div>
                <p className="font-serif text-3xl text-stone-800 mb-1 tracking-tight font-medium">NT $5,280</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Base Session Fee</p>
              </div>
              <ul className="space-y-5 text-stone-500 text-sm leading-relaxed">
                <li className="flex items-start gap-4"><Clock className="w-4 h-4 mt-0.5 text-stone-300" /><span>時間 ｜ 拍攝30分鐘</span></li>
                <li className="flex items-start gap-4"><MapPin className="w-4 h-4 mt-0.5 text-stone-300" /><span>地點 ｜ nako工作室（台中西區）</span></li>
                <li className="flex items-start gap-4"><Users className="w-4 h-4 mt-0.5 text-stone-300" /><div><p>人數 ｜ 4人為限</p><p className="text-[11px] text-stone-400 mt-1 font-sans">多1人 + NT$500，最多6人</p></div></li>
                <li className="flex items-start gap-4"><Camera className="w-4 h-4 mt-0.5 text-stone-300" /><span>內容 ｜ 當天拍攝照片全給 (約100張)，雲端交件</span></li>
                <li className="flex items-start gap-4"><Flower2 className="w-4 h-4 mt-0.5 text-stone-300" /><div><p>贈禮 ｜ by_deco 母親節花束 x1</p><p className="text-[11px] text-stone-400 mt-1 font-sans">加購：花束加大方案 + NT$600</p></div></li>
              </ul>
            </div>
          </section>
          <section className="bg-stone-50 p-8 border border-stone-100">
            <h3 className="font-serif text-sm mb-6 tracking-widest uppercase flex items-center gap-2 text-stone-600 font-medium"><CreditCard className="w-4 h-4 text-stone-400" /> 注意事項</h3>
            <div className="space-y-6">
              <div className="p-4 bg-white border border-stone-100 font-sans"><p className="text-[11px] text-stone-400 uppercase mb-1">匯款資訊</p><p className="text-sm text-stone-700 tracking-widest">連線銀行：824 / 帳號：111010678951</p></div>
              <ul className="text-[12px] text-stone-400 leading-loose space-y-2 font-serif">
                <li>• 報名繳費完成後，預約時段才算保留。</li>
                <li>• 報名成功後恕不接受退費，費用可轉定金於 2026/12/31 前使用。</li>
                <li>• 遲到 10 分鐘恕無法補時。</li>
                <li>• 拍攝照片將於 2026/5/20 前透過 Email 傳送。</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white border border-stone-100 p-8 md:p-14 shadow-sm">
            {showSuccess ? (
              <div className="text-center py-10 animate-in fade-in">
                <div className="w-16 h-16 border border-stone-100 flex items-center justify-center mx-auto mb-8"><Check className="w-6 h-6 text-stone-400" /></div>
                <h3 className="font-serif text-2xl mb-4 text-stone-800">預約成功送出</h3>
                <p className="text-stone-400 text-sm mb-10 font-serif">您的時段：{selectedDate} {selectedTime}<br/>請於 24 小時內完成匯款。</p>
                <a href={LINE_OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-[#06C755] text-white px-10 py-5 text-sm tracking-widest uppercase shadow-xl mb-10 font-sans font-medium"><MessageCircle className="w-5 h-5" /> 聯繫官方 LINE</a>
                <div className="pt-10 border-t border-stone-50"><button onClick={() => window.location.reload()} className="text-[10px] tracking-widest uppercase text-stone-300">Back</button></div>
              </div>
            ) : (
              <>
                <div className="mb-14">
                  <label className="uppercase tracking-[0.3em] text-[9px] text-stone-400 block mb-6 font-sans">Step 01 / Date</label>
                  <div className="flex flex-wrap gap-3">
                    {DATES.map(date => (
                      <button key={date} onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                        className={`px-8 py-3 text-xs font-sans transition-all border ${selectedDate === date ? 'bg-[#4A4441] text-white' : 'border-stone-100 text-stone-400 hover:border-stone-300'}`}>
                        {date.split('-')[1]} / {date.split('-')[2]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-14">
                  <label className="uppercase tracking-[0.3em] text-[9px] text-stone-400 block mb-6 font-sans">Step 02 / Time Slot</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TIME_SLOTS.map(time => {
                      const booked = bookedSlots.some(b => b.date === selectedDate && b.time === time);
                      return (
                        <button key={time} disabled={booked} onClick={() => setSelectedTime(time)}
                          className={`py-4 text-[10px] font-sans tracking-widest transition-all border ${booked ? 'bg-stone-50 text-stone-200 line-through' : selectedTime === time ? 'bg-[#E8D9D0] text-[#4A4441]' : 'border-stone-50 text-stone-400 hover:border-stone-200'}`}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedTime && (
                  <form onSubmit={handleSubmit} className="pt-12 border-t border-stone-50 space-y-10 animate-in fade-in font-serif">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="group"><label className="text-[9px] uppercase tracking-widest text-stone-300 font-sans">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border-b border-stone-100 py-3 text-sm focus:border-stone-800 outline-none bg-transparent" placeholder="預約人姓名" /></div>
                      <div className="group"><label className="text-[9px] uppercase tracking-widest text-stone-300 font-sans">Phone</label><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border-b border-stone-100 py-3 text-sm focus:border-stone-800 outline-none bg-transparent font-sans" placeholder="聯絡電話" /></div>
                    </div>
                    <div className="group"><label className="text-[9px] uppercase tracking-widest text-stone-300 font-sans">Email</label><div className="flex items-center border-b border-stone-100 py-3"><Mail className="w-3 h-3 text-stone-200 mr-3" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm outline-none bg-transparent font-sans" placeholder="電子郵件" /></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><label className="text-[9px] uppercase tracking-widest text-stone-400 font-sans">Participants</label><select value={extraPeople} onChange={(e) => setExtraPeople(parseInt(e.target.value))} className="w-full border border-stone-50 p-3 text-xs bg-stone-50 outline-none">
                        <option value="0">4人 (基本)</option><option value="1">5人 (+NT$500)</option><option value="2">6人 (+NT$1,000)</option>
                      </select></div>
                      <div className="space-y-2"><label className="text-[9px] uppercase tracking-widest text-stone-400 font-sans">Upgrade</label><div onClick={() => setBouquetUpgrade(!bouquetUpgrade)} className={`flex justify-between p-3 border cursor-pointer text-xs ${bouquetUpgrade ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-50 bg-stone-50 text-stone-400'}`}><span>花束加大</span><span>{bouquetUpgrade ? 'ADDED' : '+NT$600'}</span></div></div>
                    </div>
                    <div className="group"><label className="text-[9px] uppercase tracking-widest text-stone-300 font-sans flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Note</label><textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full mt-4 border border-stone-50 p-4 text-[12px] bg-stone-50 min-h-[100px] outline-none" placeholder="備註、許願平日時段..." /></div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A4441] text-white py-6 text-[10px] tracking-[0.3em] uppercase hover:bg-stone-700 shadow-lg flex items-center justify-center gap-3 font-sans font-medium">{isSubmitting ? "Processing..." : "Confirm & Book Now"} <ArrowRight className="w-3 h-3" /></button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-20 text-center text-stone-200 text-[9px] tracking-[0.3em] uppercase font-sans">
        <p className="mb-4">nako studio . Taichung West District . 2026</p>
        <button onClick={() => setView(view === 'admin' ? 'booking' : 'admin_login')} className="admin-trigger flex items-center gap-1 mx-auto"><Settings className="w-3 h-3" /> Admin Console</button>
      </footer>
    </div>
  );
}