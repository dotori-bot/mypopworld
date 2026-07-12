import React, { useRef, useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { ImagePlus, X } from 'lucide-react';

// Longest edge of the stored data URL. Uploads are usually photos/scans of a
// child's drawing (multi-MP) — downscaling keeps the zustand store, the SVG
// pages and the PDF export light while staying plenty sharp for a preview.
const MAX_DIM = 768;

/**
 * Decode an uploaded image file and re-encode it as a downscaled PNG data URL.
 * PNG keeps transparency for drawings exported from paint apps; photos of
 * paper drawings simply keep their white background.
 * (Shared with CustomizePanel's card-skin image upload.)
 */
export async function fileToArtDataUrl(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      el.src = objectUrl;
    });
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * UserArtUpload — "내 그림 업로드" control shared by the 2D template preview
 * and the 3D simulation. Stores the picked drawing in useCardStore.userArt;
 * consumers decide how to apply it (decoration page / --user-art CSS var).
 */
export default function UserArtUpload() {
  const { userArt, setUserArt } = useCardStore();
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    e.target.value = '';
    if (!file) return;
    try {
      setError(null);
      setUserArt(await fileToArtDataUrl(file));
    } catch {
      setError('이미지를 불러오지 못했어요. 다른 파일을 시도해 주세요.');
    }
  };

  return (
    <div className="user-art-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        type="button"
        className="decoration-mode-btn"
        onClick={() => inputRef.current?.click()}
        title="직접 그린 그림 사진/파일을 올리면 도안과 3D 미리보기에 적용해 볼 수 있어요"
      >
        <ImagePlus size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
        {userArt ? '내 그림 바꾸기' : '내 그림 업로드'}
      </button>
      {userArt && (
        <span className="user-art-thumb-wrap">
          <img className="user-art-thumb" src={userArt} alt="업로드한 내 그림" />
          <button
            type="button"
            className="user-art-clear"
            aria-label="업로드한 그림 지우기"
            onClick={() => setUserArt(null)}
          >
            <X size={12} />
          </button>
        </span>
      )}
      {error && <span className="user-art-error">{error}</span>}
    </div>
  );
}
