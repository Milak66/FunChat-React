import React, { useState } from "react";
import Cropper from "react-easy-crop";
import "./avatarEditor.css";

import {
    getCroppedImg,
    PixelCrop
} from "./cropImage";

interface AvatarEditorProps {
    userId: number | null;
    currentAvatar?: string | null;
    onAvatarChanged?: (avatar: string) => void;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({
    userId,
    currentAvatar,
    onAvatarChanged
}) => {

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [crop, setCrop] = useState({
        x: 0,
        y: 0
    });

    const [zoom, setZoom] = useState(1);

    const [croppedAreaPixels, setCroppedAreaPixels] =
        useState<PixelCrop | null>(null);

    const [isUploading, setIsUploading] =
        useState(false);


    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {
            alert("Please select an image");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be smaller than 10MB");
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        setSelectedImage(imageUrl);

        setCrop({
            x: 0,
            y: 0
        });

        setZoom(1);
    };

    const handleCropComplete = (
        _: any,
        croppedAreaPixels: PixelCrop
    ) => {

        setCroppedAreaPixels(croppedAreaPixels);
    };

    const saveAvatar = async () => {

        if (!selectedImage || !croppedAreaPixels) {
            return;
        }

        try {

            setIsUploading(true);

            const croppedBlob = await getCroppedImg(
                selectedImage,
                croppedAreaPixels
            );

            const formData = new FormData();

            formData.append(
                "avatar",
                croppedBlob,
                "avatar.webp"
            );

            const response = await fetch(
                `https://funchat-rwvy.onrender.com/users/${userId}/avatar`,
                {
                    method: "PATCH",
                    body: formData
                }
            );

            if (!response.ok) {

                const message =
                    await response.text();

                throw new Error(message);
            }

            const data = await response.json();

            if (onAvatarChanged) {
                onAvatarChanged(data.avatar);
            }

            closeEditor();

        } catch (error) {

            console.error(
                "Avatar upload failed:",
                error
            );

            alert("Failed to upload avatar");

        } finally {

            setIsUploading(false);
        }
    };

    const closeEditor = () => {

        if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
        }

        setSelectedImage(null);

        setCrop({
            x: 0,
            y: 0
        });

        setZoom(1);

        setCroppedAreaPixels(null);
    };


    return (
        <>
            <div className="avatarEditor">
                <label
                    className="avatarPreview"
                >
                    {currentAvatar ? (
                        <img
                            src={`https://funchat-rwvy.onrender.com${currentAvatar}`}
                            alt="Avatar"
                        />
                    ) : (
                        <div className="avatarPlaceholder">
                            +
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileSelect}
                        hidden
                    />
                </label>
                <div className="avatarHint">
                    Change avatar
                </div>
            </div>
            {selectedImage && (
                <div className="avatarModal">
                    <div className="avatarModalContent">
                        <div className="avatarModalTitle">
                            Choose your avatar
                        </div>
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

                                onCropComplete={
                                    handleCropComplete
                                }
                            />

                        </div>


                        <div className="zoomContainer">

                            <span>
                                −
                            </span>

                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="0.01"
                                value={zoom}
                                onChange={(event) =>
                                    setZoom(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                            />

                            <span>
                                +
                            </span>

                        </div>


                        <div className="avatarModalButtons">

                            <button
                                type="button"
                                className="avatarCancelButton"
                                onClick={closeEditor}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="avatarSaveButton"
                                onClick={saveAvatar}
                                disabled={isUploading}
                            >
                                {isUploading
                                    ? "Saving..."
                                    : "Save"
                                }
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
};

export default AvatarEditor;