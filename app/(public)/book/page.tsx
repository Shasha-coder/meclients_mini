'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, Check } from 'lucide-react'

// Mock Data
const WEEKS = [
  ['01', '02', '03', '04', '05', '06', '07'],
  ['08', '09', '10', '11', '12', '13', '14'],
  ['15', '16', '17', '18', '19', '20', '21'],
  ['22', '23', '24', '25', '26', '27', '28'],
  ['29', '30', '31', '01', '02', '03', '04']
]
const TIMES = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM']

export default function PublicBookingPage() {
  const [selectedDate, setSelectedDate] = useState('13')
  const [selectedTime, setSelectedTime] = useState('10:00 AM')
  const [step, setStep] = useState(1) // 1: DateTime, 2: Details, 3: Success
  const [service, setService] = useState('Consultation')
  
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] shadow-sm max-w-md w-full p-8">
          <button onClick={() => setStep(1)} className="mb-6 flex items-center text-[#64748B] hover:text-[#0f172a] transition-colors">
            <ChevronLeft size={20} /> <span className="text-sm font-medium ml-1">Back</span>
          </button>
          <div className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase mb-2">Step 02 / 02</div>
          <h2 className="text-2xl font-bold text-[#0F172A] leading-tight mb-8">Confirm your details.</h2>
          
          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Full Name" className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[15px] outline-none focus:border-[#2eb87a] focus:bg-white transition-all text-[#0f172a]" />
            <input type="email" placeholder="Email Address" className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[15px] outline-none focus:border-[#2eb87a] focus:bg-white transition-all text-[#0f172a]" />
            <input type="tel" placeholder="Phone Number" className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[15px] outline-none focus:border-[#2eb87a] focus:bg-white transition-all text-[#0f172a]" />
          </div>

          <div className="bg-[#F0FDF8] rounded-2xl p-5 border border-[#c6f6d5] mb-8">
            <div className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide mb-1">Appointment</div>
            <div className="text-[#0f172a] font-medium text-[15px]">{service}</div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-[#bbf7d0]">
              <div>
                <div className="text-xs text-[#64748b] mb-0.5">Date</div>
                <div className="text-sm font-medium text-[#0f172a]">April {selectedDate}, 2024</div>
              </div>
              <div>
                <div className="text-xs text-[#64748b] mb-0.5">Time</div>
                <div className="text-sm font-medium text-[#0f172a]">{selectedTime}</div>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(3)} className="w-full bg-[#2eb87a] text-white py-4 rounded-full font-semibold text-[15px] hover:bg-[#259b66] transition-colors flex justify-center items-center gap-2 shadow-[0_4px_14px_rgba(46,184,122,0.3)]">
            Book Appointment <Check size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] shadow-sm max-w-md w-full p-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-[#F0FDF8] rounded-full flex items-center justify-center mb-6 border-8 border-[#dcfce7]">
            <Check size={32} className="text-[#16a34a] stroke-[3px]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Booking Confirmed!</h2>
          <p className="text-[#64748B] text-[15px] leading-relaxed mb-8">We've sent a calendar invitation and confirmation details to your email.</p>
          <button className="text-[#2eb87a] font-medium hover:text-[#16a34a] transition-colors" onClick={() => setStep(1)}>Book another appointment</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-[900px] w-full p-6 md:p-10 flex flex-col md:flex-row gap-8 lg:gap-14">
        
        {/* Left: Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">April 2024</h2>
            <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm opacity-60">
              <button className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors"><ChevronLeft size={18} className="text-[#64748B]" /></button>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2eb87a] mx-1" />
              <button className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors"><ChevronRight size={18} className="text-[#64748B]" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[13px] font-semibold text-[#0F172A] py-2">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-3 gap-x-2">
            {WEEKS.map((week, wIdx) => (
              week.map((day, dIdx) => {
                const isPast = wIdx === 0 && dIdx < 2
                const isNextMonth = wIdx === 4 && dIdx > 2
                const isSelected = selectedDate === day && !isPast && !isNextMonth
                
                return (
                  <button 
                    key={`${wIdx}-${dIdx}`}
                    onClick={() => { if(!isPast && !isNextMonth) setSelectedDate(day) }}
                    disabled={isPast || isNextMonth}
                    className={`
                      aspect-square flex items-center justify-center rounded-2xl text-[15px] font-medium transition-all
                      ${isPast || isNextMonth ? 'text-[#CBD5E1] cursor-not-allowed opacity-50' : ''}
                      ${!isPast && !isNextMonth && !isSelected ? 'bg-[#dcfce7] text-[#334155] hover:bg-[#bbf7d0] cursor-pointer' : ''}
                      ${isSelected ? 'bg-[#286e45] text-white shadow-lg scale-105' : ''}
                    `}
                  >
                    {day}
                    {isSelected && <div className="absolute bottom-2 w-3 h-[2px] bg-white rounded-full opacity-70" />}
                  </button>
                )
              })
            ))}
          </div>
        </div>

        {/* Right: Time Slots */}
        <div className="w-full md:w-[320px] flex flex-col">
          <h3 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center">
            Saturday, 13 April
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 pb-4 max-h-[400px]" style={{ scrollbarWidth: 'thin' }}>
            {TIMES.map(time => {
              const isActive = selectedTime === time
              return (
                <div key={time} className="flex gap-2">
                  <button 
                    onClick={() => setSelectedTime(time)}
                    className={`
                      flex-1 py-4 px-6 rounded-2xl border text-[14px] font-medium transition-all text-center
                      ${isActive ? 'bg-[#bbf7d0] border-[#86efac] text-[#166534]' : 'border-[#E2E8F0] hover:border-[#bbf7d0] text-[#334155] bg-white hover:bg-[#F0FDF4]'}
                    `}
                  >
                    {time}
                  </button>
                  {isActive && (
                    <button 
                      onClick={() => setStep(2)}
                      className="bg-[#286e45] text-white px-6 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#1e5334] transition-colors shadow-[0_4px_14px_rgba(40,110,69,0.3)] animate-fade-in"
                    >
                      Next <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
