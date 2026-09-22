'use client';

import { useState, useRef, useEffect, useId } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  onClose?: () => void;
}

type QRType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard';
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// ── Brand-aligned custom select ──────────────────────────────────────────────
interface SelectOpt { value: string; label: string; }
interface BrandSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOpt[];
  id?: string;
}

function BrandSelect({ value, onChange, options, id }: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        type="button"
        id={id ?? uid}
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: open ? '1px solid rgba(0,255,136,0.45)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          color: '#fff',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(0,255,136,0.07)' : 'none',
        }}
      >
        <span>{selected?.label ?? value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M1 3l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 50,
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'rgba(14,14,20,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          animation: 'qrDropIn 0.15s ease',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                fontSize: 13,
                background: opt.value === value ? 'rgba(0,255,136,0.09)' : 'transparent',
                color: opt.value === value ? '#00ff88' : 'rgba(255,255,255,0.75)',
                fontWeight: opt.value === value ? 600 : 400,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = opt.value === value ? 'rgba(0,255,136,0.09)' : 'transparent';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

function BrandInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        border: focused ? '1px solid rgba(0,255,136,0.45)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(0,255,136,0.07)' : 'none',
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function BrandTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: 'none',
        border: focused ? '1px solid rgba(0,255,136,0.45)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(0,255,136,0.07)' : 'none',
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.35)',
      marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 7 }}>
      {children}
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function QRCodeGenerator({ onClose }: QRCodeGeneratorProps) {
  const [qrType, setQRType] = useState<QRType>('url');
  const [qrData, setQRData] = useState('https://prismspace.io');
  const [qrDataURL, setQRDataURL] = useState('');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');
  const [size, setSize] = useState(300);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [margin, setMargin] = useState(4);
  const [includeMargin, setIncludeMargin] = useState(true);

  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardUrl, setVcardUrl] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    let dataToEncode = qrData;
    switch (qrType) {
      case 'email': dataToEncode = `mailto:${qrData}`; break;
      case 'phone': dataToEncode = `tel:${qrData}`; break;
      case 'sms': dataToEncode = `sms:${qrData}`; break;
      case 'wifi': dataToEncode = `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`; break;
      case 'vcard': dataToEncode = `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nORG:${vcardOrg}\nURL:${vcardUrl}\nEND:VCARD`; break;
    }
    
    // For wifi and vcard, check if required fields are filled
    if (qrType === 'wifi' && !wifiSSID) return;
    if (qrType === 'vcard' && !vcardName) return;
    if (!dataToEncode && qrType !== 'wifi' && qrType !== 'vcard') return;
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await QRCode.toCanvas(canvas, dataToEncode, {
        errorCorrectionLevel: errorLevel,
        width: size,
        margin: includeMargin ? margin : 0,
        color: { dark: darkColor, light: lightColor },
      });
      const dataUrl = await QRCode.toDataURL(dataToEncode, {
        errorCorrectionLevel: errorLevel,
        width: size,
        margin: includeMargin ? margin : 0,
        color: { dark: darkColor, light: lightColor },
      });
      setQRDataURL(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  useEffect(() => {
    generateQRCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData, qrType, errorLevel, size, darkColor, lightColor, margin, includeMargin,
    wifiSSID, wifiPassword, wifiEncryption, wifiHidden,
    vcardName, vcardPhone, vcardEmail, vcardOrg, vcardUrl]);

  const downloadQRCode = () => {
    if (!qrDataURL) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrDataURL;
    link.click();
  };

  const copyToClipboard = async () => {
    if (!qrDataURL) return;
    try {
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const QR_TYPES = [
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'phone', label: 'Phone', icon: '📞' },
    { value: 'sms', label: 'SMS', icon: '💬' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'vcard', label: 'vCard', icon: '👤' },
  ];

  const renderInputFields = () => {
    switch (qrType) {
      case 'wifi':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <FieldLabel>Network Name (SSID)</FieldLabel>
              <BrandInput type="text" value={wifiSSID} onChange={e => setWifiSSID(e.target.value)} placeholder="MyNetwork" />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <BrandInput type="text" value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="password123" />
            </div>
            <div>
              <FieldLabel>Encryption</FieldLabel>
              <BrandSelect
                value={wifiEncryption}
                onChange={v => setWifiEncryption(v as any)}
                options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'No Password' }]}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={wifiHidden} onChange={e => setWifiHidden(e.target.checked)}
                style={{ accentColor: '#00ff88', width: 16, height: 16, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Hidden Network</span>
            </label>
          </div>
        );

      case 'vcard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Full Name', value: vcardName, onChange: setVcardName, placeholder: 'John Doe', type: 'text' },
              { label: 'Phone', value: vcardPhone, onChange: setVcardPhone, placeholder: '+1234567890', type: 'tel' },
              { label: 'Email', value: vcardEmail, onChange: setVcardEmail, placeholder: 'john@example.com', type: 'email' },
              { label: 'Organization', value: vcardOrg, onChange: setVcardOrg, placeholder: 'Company Inc.', type: 'text' },
              { label: 'Website', value: vcardUrl, onChange: setVcardUrl, placeholder: 'https://example.com', type: 'url' },
            ].map(f => (
              <div key={f.label}>
                <FieldLabel>{f.label}</FieldLabel>
                <BrandInput type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div>
            <FieldLabel>
              {qrType === 'url' ? 'URL' :
                qrType === 'email' ? 'Email Address' :
                qrType === 'phone' ? 'Phone Number' :
                qrType === 'sms' ? 'Phone Number' : 'Text Content'}
            </FieldLabel>
            <BrandTextarea
              value={qrData}
              onChange={e => setQRData(e.target.value)}
              placeholder={
                qrType === 'url' ? 'https://example.com' :
                qrType === 'email' ? 'email@example.com' :
                qrType === 'phone' ? '+1234567890' :
                qrType === 'sms' ? '+1234567890' :
                'Enter your text here…'
              }
              rows={3}
            />
          </div>
        );
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
      color: '#fff',
      background: 'transparent',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,100,255,0.03) 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,150,255,0.2) 100%)',
            border: '1px solid rgba(0,255,136,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            📱
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>
              QR Code Generator
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 2 }}>
              Create custom QR codes instantly
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 12,
          alignItems: 'start',
        }}>
          {/* LEFT: Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* QR Type */}
            <Card>
              <SectionTitle>QR Code Type</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {QR_TYPES.map(type => {
                  const active = qrType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setQRType(type.value as QRType)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        border: active ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        background: active ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                        color: active ? '#00ff88' : 'rgba(255,255,255,0.55)',
                        boxShadow: active ? '0 0 12px rgba(0,255,136,0.08)' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                        }
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Content */}
            <Card>
              <SectionTitle>Content</SectionTitle>
              {renderInputFields()}
            </Card>

            {/* Customization */}
            <Card>
              <SectionTitle>Customization</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Size slider */}
                <div>
                  <FieldLabel>
                    Size — <span style={{ color: '#00ff88', fontWeight: 600 }}>{size}px</span>
                  </FieldLabel>
                  <input
                    type="range" min="200" max="600" value={size}
                    onChange={e => setSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#00ff88' }}
                  />
                </div>

                {/* Error Correction */}
                <div>
                  <FieldLabel>Error Correction</FieldLabel>
                  <BrandSelect
                    value={errorLevel}
                    onChange={v => setErrorLevel(v as ErrorCorrectionLevel)}
                    options={[
                      { value: 'L', label: 'Low (7%)' },
                      { value: 'M', label: 'Medium (15%)' },
                      { value: 'Q', label: 'Quartile (25%)' },
                      { value: 'H', label: 'High (30%)' },
                    ]}
                  />
                </div>

                {/* Colors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Foreground', color: darkColor, setColor: setDarkColor },
                    { label: 'Background', color: lightColor, setColor: setLightColor },
                  ].map(({ label, color, setColor }) => (
                    <div key={label}>
                      <FieldLabel>{label}</FieldLabel>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="color" value={color}
                          onChange={e => setColor(e.target.value)}
                          style={{
                            width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'none', padding: 2,
                          }}
                        />
                        <BrandInput
                          type="text" value={color}
                          onChange={e => setColor(e.target.value)}
                          style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Margin */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <FieldLabel>
                      Margin — <span style={{ color: includeMargin ? '#00ff88' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{margin}</span>
                    </FieldLabel>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox" checked={includeMargin}
                        onChange={e => setIncludeMargin(e.target.checked)}
                        style={{ accentColor: '#00ff88', width: 14, height: 14, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Include</span>
                    </label>
                  </div>
                  <input
                    type="range" min="0" max="10" value={margin}
                    onChange={e => setMargin(Number(e.target.value))}
                    disabled={!includeMargin}
                    style={{ width: '100%', accentColor: '#00ff88', opacity: includeMargin ? 1 : 0.3 }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Preview + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>

            {/* Preview */}
            <Card>
              <SectionTitle>Preview</SectionTitle>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                border: '1px dashed rgba(255,255,255,0.1)',
                minHeight: 200,
              }}>
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                />
              </div>
            </Card>

            {/* Actions */}
            <Card>
              <SectionTitle>Actions</SectionTitle>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={downloadQRCode}
                  disabled={!qrDataURL}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: qrDataURL
                      ? 'linear-gradient(135deg, #00ff88 0%, #00c4ff 100%)'
                      : 'rgba(255,255,255,0.06)',
                    color: qrDataURL ? '#000' : 'rgba(255,255,255,0.25)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: qrDataURL ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'opacity 0.15s',
                    boxShadow: qrDataURL ? '0 4px 20px rgba(0,255,136,0.2)' : 'none',
                  }}
                >
                  ⬇ Download
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={!qrDataURL}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: copied ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    background: copied ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                    color: copied ? '#00ff88' : 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: qrDataURL ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                    opacity: qrDataURL ? 1 : 0.4,
                  }}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  💡
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tips
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      'Higher error correction allows damaged codes to still scan',
                      'Use high contrast colors for better scanning reliability',
                      'Test your QR code with multiple devices before printing',
                    ].map(tip => (
                      <li key={tip} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        <span style={{ color: '#00ff88', marginTop: 1, flexShrink: 0 }}>▸</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes qrDropIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
