import React, { useState } from "react";
import Cropper from "react-easy-crop";
import { useSelector } from "react-redux";
import "./avatarEditor.css";

import { RootState } from "../store/store.tsx";
import { avatarUrl, handleAvatarError } from "./avatarUrl.ts";

import { getCroppedImg, PixelCrop } from "./cropImage.ts";

interface AvatarEditorProps {
  userId: number | null;
  currentAvatar?: string | null;
  onAvatarChanged?: (avatar: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const AvatarEditor: React.FC<AvatarEditorProps> = ({
  userId,
  currentAvatar,
  onAvatarChanged,
}) => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // lets you pick the same file again after cancelling
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      return;
    }

    setSelectedImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropComplete = (_: unknown, areaPixels: PixelCrop) => {
    setCroppedAreaPixels(areaPixels);
  };

  const closeEditor = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const saveAvatar = async () => {
    if (!selectedImage || !croppedAreaPixels || !userId) {
      return;
    }

    try {
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);

      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.webp");

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/${userId}/avatar`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Upload failed (${response.status})`);
      }

      onAvatarChanged?.(data.avatar);

      closeEditor();

    } catch (error) {
      console.error("Avatar upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="avatarEditor">
        <label className="avatarPreview">
          {currentAvatar ? (
            <img
              src={avatarUrl(currentAvatar)}
              alt=""
              onError={handleAvatarError}
            />
          ) : (
            <div className="avatarPlaceholder">+</div>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            hidden
          />
        </label>

        <div className="avatarHint">{texts.changeAvatarText}</div>
      </div>

      {selectedImage && (
        <div className="avatarModal">
          <div className="avatarModalContent">
            <div className="avatarModalTitle">{texts.changeAvatarText}</div>

            <div className="cropContainer">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                minZoom={1}
                maxZoom={4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="zoomContainer">
              <span>−</span>

              <input
                type="range"
                min="1"
                max="4"
                step="0.01"
                value={zoom}
                aria-label="Zoom"
                onChange={(event) => setZoom(Number(event.target.value))}
              />

              <span>+</span>
            </div>

            <div className="avatarModalButtons">
              <button
                type="button"
                className="avatarCancelButton"
                onClick={closeEditor}
                disabled={isUploading}
              >
                {texts.cancelAvatarText}
              </button>

              <button
                type="button"
                className="avatarSaveButton"
                onClick={saveAvatar}
                disabled={isUploading}
              >
                {isUploading ? "..." : texts.saveAvatarText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarEditor;
