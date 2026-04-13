'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const PROVINCES = [
  '北京市', '上海市', '天津市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
]

const PROVINCE_CITIES: Record<string, string[]> = {
  '北京市': ['北京'], '上海市': ['上海'], '天津市': ['天津'], '重庆市': ['重庆'],
  '广东省': ['广州', '深圳', '珠海', '佛山', '惠州', '东莞', '汕头', '江门', '湛江'],
  '浙江省': ['杭州', '宁波', '温州', '绍兴', '嘉兴', '湖州', '金华', '台州'],
  '江苏省': ['南京', '苏州', '无锡', '常州', '南通', '扬州', '镇江', '盐城'],
  '四川省': ['成都', '绵阳', '德阳', '宜宾', '泸州', '达州', '南充', '乐山'],
  '湖北省': ['武汉', '宜昌', '襄阳', '荆州', '黄石', '十堰'],
  '陕西省': ['西安', '咸阳', '宝鸡', '延安', '榆林', '汉中'],
  '山东省': ['济南', '青岛', '烟台', '潍坊', '淄博', '临沂', '济宁'],
  '河南省': ['郑州', '洛阳', '开封', '南阳', '许昌', '新乡', '焦作'],
  '湖南省': ['长沙', '株洲', '湘潭', '衡阳', '岳阳', '常德', '张家界'],
  '福建省': ['福州', '厦门', '泉州', '漳州', '莆田', '三明'],
  '辽宁省': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东'],
  '黑龙江省': ['哈尔滨', '齐齐哈尔', '牡丹江', '大庆', '绥化'],
  '吉林省': ['长春', '吉林', '延边', '四平', '通化'],
  '云南省': ['昆明', '大理', '丽江', '曲靖', '玉溪'],
  '贵州省': ['贵阳', '遵义', '六盘水', '安顺'],
  '广西壮族自治区': ['南宁', '柳州', '桂林', '梧州', '北海'],
  '海南省': ['海口', '三亚', '琼海', '文昌'],
  '甘肃省': ['兰州', '天水', '白银', '嘉峪关', '张掖', '酒泉'],
  '青海省': ['西宁', '海西', '海东'],
  '新疆维吾尔自治区': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '喀什'],
  '西藏自治区': ['拉萨', '日喀则', '林芝', '昌都'],
  '内蒙古自治区': ['呼和浩特', '包头', '赤峰', '鄂尔多斯', '呼伦贝尔'],
  '宁夏回族自治区': ['银川', '石嘴山', '吴忠', '固原'],
  '河北省': ['石家庄', '唐山', '秦皇岛', '邯郸', '保定', '张家口', '承德'],
  '山西省': ['太原', '大同', '阳泉', '长治', '晋城', '晋中'],
  '安徽省': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '铜陵', '安庆'],
  '江西省': ['南昌', '九江', '景德镇', '萍乡', '新余', '赣州'],
}

interface Profile {
  name: string
  gender: 'male' | 'female'
  birth_date: string
  birth_time: string
  birth_province: string
  birth_city: string
}

const STEPS = ['基本信息', '出生信息', '完成']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Profile>({
    name: '',
    gender: 'male',
    birth_date: '',
    birth_time: '12:00',
    birth_province: '',
    birth_city: '',
  })

  const cities = PROVINCE_CITIES[profile.birth_province] || []

  const canNext = () => {
    if (step === 0) return profile.name.trim().length > 0
    if (step === 1) return profile.birth_date && profile.birth_time && profile.birth_province && profile.birth_city
    return true
  }

  const handleFinish = () => {
    localStorage.setItem('tr_profile', JSON.stringify(profile))
    router.push('/home')
  }

  const field = (label: string, hint?: string, children?: React.ReactNode) => (
    <div style={{ marginBottom: '22px' }}>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-faint)', marginLeft: '6px', textTransform: 'none', letterSpacing: 0 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🌊</div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>欢迎来到 Time River</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>用 2 分钟建立你的命理档案，AI 将为你量身解读</p>
        </div>

        {/* 进度指示 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '0' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: i <= step ? 'linear-gradient(135deg, #2A1F1A, #3D2E25)' : 'var(--bg-subtle)',
                color: i <= step ? '#F7F2EB' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, flexShrink: 0,
                transition: 'all 0.3s',
                boxShadow: i <= step ? '0 2px 8px rgba(42,31,26,0.25)' : 'none',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '12px', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', marginLeft: '7px', whiteSpace: 'nowrap', fontWeight: i === step ? 600 : 400 }}>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: i < step ? 'var(--border-mid)' : 'var(--border)', margin: '0 14px', borderRadius: '2px', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* 卡片 */}
        <div className="card-lg" style={{ padding: '36px' }}>
          <AnimatePresence mode="wait">

            {/* Step 0: 基本信息 */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>你叫什么名字？</h2>

                {field('你的名字', '（或者你希望被如何称呼）',
                  <input
                    className="input"
                    placeholder="输入名字"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    autoFocus
                  />
                )}

                {field('性别',
                  undefined,
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['male', 'female'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, gender: g }))}
                        style={{
                          flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                          border: profile.gender === g ? '2px solid rgba(42,31,26,0.6)' : '1.5px solid var(--border-input)',
                          background: profile.gender === g ? 'linear-gradient(135deg,#F5EFE6,#EDE4D6)' : 'var(--bg-input)',
                          color: profile.gender === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '15px', fontWeight: profile.gender === g ? 700 : 400,
                          transition: 'all 0.18s',
                          boxShadow: profile.gender === g ? '0 2px 8px rgba(42,31,26,0.12)' : 'var(--shadow-input)',
                        }}
                      >
                        {g === 'male' ? '♂  男' : '♀  女'}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 1: 出生信息 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>出生信息</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>用于八字排盘与命理解读，仅保存在你的设备上</p>

                {field('出生日期',
                  undefined,
                  <input type="date" className="input" value={profile.birth_date}
                    onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))} />
                )}

                {field('出生时间', '（不确定可填 12:00）',
                  <input type="time" className="input" value={profile.birth_time}
                    onChange={e => setProfile(p => ({ ...p, birth_time: e.target.value }))} />
                )}

                {field('出生省份',
                  undefined,
                  <select className="input" value={profile.birth_province}
                    onChange={e => setProfile(p => ({ ...p, birth_province: e.target.value, birth_city: '' }))}>
                    <option value="">请选择省份</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}

                {field('出生城市',
                  undefined,
                  cities.length > 0
                    ? <select className="input" value={profile.birth_city}
                        onChange={e => setProfile(p => ({ ...p, birth_city: e.target.value }))}>
                        <option value="">请选择城市</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    : <input className="input" placeholder="输入城市名" value={profile.birth_city}
                        onChange={e => setProfile(p => ({ ...p, birth_city: e.target.value }))} />
                )}
              </motion.div>
            )}

            {/* Step 2: 完成 */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>✨</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                  {profile.name}，欢迎加入时光流
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.8 }}>
                  你的命理档案已建立完成<br />
                  每一次记录，都将成为你改命的轨迹
                </p>
                <div style={{
                  marginTop: '24px', padding: '16px', borderRadius: '12px',
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                  fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'left',
                }}>
                  <div>👤 {profile.name} · {profile.gender === 'male' ? '男' : '女'}</div>
                  <div style={{ marginTop: '6px' }}>📅 {profile.birth_date} {profile.birth_time}</div>
                  <div style={{ marginTop: '6px' }}>📍 {profile.birth_province} {profile.birth_city}</div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* 按钮区 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            {step > 0 && step < 2 && (
              <button className="btn-outline" style={{ padding: '12px 20px' }} onClick={() => setStep(s => s - 1)}>
                上一步
              </button>
            )}
            {step < 2 ? (
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '13px', fontSize: '15px', opacity: canNext() ? 1 : 0.4 }}
                onClick={() => canNext() && setStep(s => s + 1)}
                disabled={!canNext()}
              >
                下一步 →
              </button>
            ) : (
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '13px', fontSize: '15px' }}
                onClick={handleFinish}
              >
                开始我的时光记录 🌊
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
