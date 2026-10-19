'use client';
/**
 * CloudinaryUploader
 * ------------------
 * Uploads directly to Cloudinary with a short-lived signature issued only
 * to a signed-in admin. The Cloudinary API secret stays on the server.
 * After upload completes, calls onUploaded() with the final URL.
 *
 * If Cloudinary ever rejects an upload, the error from their API is shown
 * to the user verbatim — no silent failures.
 */
import { useState, useRef } from 'react';

// Client-side limits prevent accidental large uploads.
const MAX_FILE_BYTES = 10 * 1024 * 1024;   // 10 MB before upload
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

interface Props {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  language?: 'en' | 'sq';
}

export default function CloudinaryUploader({ currentUrl, onUploaded, label, language = 'en' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = language === 'sq' ? {
    chooseOrDrop: 'Klikoni ose zvarritni një foto këtu',
    formats: 'JPG, PNG, WEBP — deri në 10 MB',
    uploading: 'Duke ngarkuar',
    replace: 'Zëvendëso foton',
    remove: 'Hiq foton',
    tooLarge: 'Foto është shumë e madhe. Madhësia maksimale është 10 MB.',
    wrongType: 'Lloji i skedarit nuk lejohet. Përdorni JPG, PNG ose WEBP.',
    uploadFailed: 'Ngarkimi dështoi',
  } : {
    chooseOrDrop: 'Click or drop a photo here',
    formats: 'JPG, PNG, WEBP — up to 10 MB',
    uploading: 'Uploading',
    replace: 'Replace photo',
    remove: 'Remove photo',
    tooLarge: 'File is too large. Maximum size is 10 MB.',
    wrongType: 'File type not allowed. Use JPG, PNG, or WEBP.',
    uploadFailed: 'Upload failed',
  };

  const validateAndUpload = (file: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t.wrongType);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t.tooLarge);
      return;
    }
    uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    setProgress(0);

    let authorization: { cloudName: string; apiKey: string; timestamp: number; signature: string; assetFolder: string };
    try {
      const response = await fetch('/api/admin-upload-signature', { method: 'POST', cache: 'no-store' });
      if (!response.ok) throw new Error('Admin sign-in or image upload configuration required');
      authorization = await response.json();
    } catch (err) {
      setUploading(false);
      setError(`${t.uploadFailed}: ${err instanceof Error ? err.message : 'authorization failed'}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', authorization.apiKey);
    formData.append('timestamp', String(authorization.timestamp));
    formData.append('signature', authorization.signature);
    formData.append('asset_folder', authorization.assetFolder);

    // XMLHttpRequest used (not fetch) because we need real upload progress
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          // secure_url is the HTTPS URL Cloudinary returns
          if (response.secure_url) {
            // Add Cloudinary URL-based transformations so images are
            // automatically resized + optimized for the web. Inserts
            // `w_1600,q_auto,f_auto` right after `/upload/` so we get:
            //   - max width 1600px (sharp on retina, light on bandwidth)
            //   - automatic quality (Cloudinary picks the best level)
            //   - automatic format (AVIF/WebP/JPG depending on browser)
            // This means colleagues never need to configure Cloudinary
            // "Upload Manipulations" — optimisation happens via the URL.
            const optimized = response.secure_url.replace(
              '/image/upload/',
              '/image/upload/w_1600,q_auto,f_auto/'
            );
            onUploaded(optimized);
            setProgress(0);
          } else {
            setError(`${t.uploadFailed}: no URL returned`);
          }
        } catch {
          setError(`${t.uploadFailed}: invalid response`);
        }
      } else {
        // Cloudinary returns useful error messages — surface them
        let serverMsg = '';
        try {
          const errBody = JSON.parse(xhr.responseText);
          serverMsg = errBody?.error?.message || '';
        } catch { /* ignore */ }
        setError(`${t.uploadFailed} (${xhr.status})${serverMsg ? `: ${serverMsg}` : ''}`);
      }
    });

    xhr.addEventListener('error', () => {
      setUploading(false);
      setError(`${t.uploadFailed}: network error`);
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(authorization.cloudName)}/image/upload`);
    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset so the same file can be re-picked
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndUpload(file);
  };

  return (
    <div>
      {label && (
        <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Main drop zone / preview */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#c9a84c' : (currentUrl ? '#e8e0d4' : '#ddd')}`,
          background: dragOver ? '#fdf9f0' : (currentUrl ? '#fff' : '#fafafa'),
          padding: currentUrl ? '12px' : '32px 16px',
          cursor: uploading ? 'wait' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.15s',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: currentUrl ? 0 : 120,
        }}
      >
        {uploading ? (
          <>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-sans)' }}>
              {t.uploading}… {progress}%
            </p>
            <div style={{ width: '100%', maxWidth: 240, height: 4, background: '#eee', overflow: 'hidden', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#c9a84c', transition: 'width 0.2s' }} />
            </div>
          </>
        ) : currentUrl ? (
          <>
            {/* Preview thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
            />
            <p style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-sans)', marginTop: 4 }}>
              {t.replace}
            </p>
          </>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p style={{ fontSize: 13, color: '#444', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{t.chooseOrDrop}</p>
              <p style={{ fontSize: 11, color: '#aaa', fontFamily: 'var(--font-sans)', marginTop: 4 }}>{t.formats}</p>
            </div>
          </>
        )}
      </div>

      {/* Remove button — only when an image is set and we're not uploading */}
      {currentUrl && !uploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUploaded(''); setError(''); }}
          style={{
            marginTop: 8,
            background: 'transparent',
            border: 'none',
            color: '#a00',
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          {t.remove}
        </button>
      )}

      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#c0392b', fontFamily: 'var(--font-sans)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
