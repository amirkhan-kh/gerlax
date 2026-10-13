"use client"

import { useEffect, useRef, useState } from "react"

import { compress } from "@/lib/image"

export function PhotoPicker({
  preview,
  onPhoto,
  onError,
}: {
  preview: string | null
  onPhoto: (dataUrl: string | null) => void
  onError: (message: string) => void
}) {
  const [cameraOn, setCameraOn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!cameraOn || !video || !stream) return
    video.srcObject = stream
    void video.play()
    return () => {
      video.srcObject = null
    }
  }, [cameraOn])

  async function openCamera() {
    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      const attempts: MediaStreamConstraints[] = [
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        { audio: false, video: { facingMode: "user" } },
        { audio: false, video: true },
      ]
      for (const constraints of attempts) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current?.getTracks().forEach((track) => track.stop())
          streamRef.current = stream
          setCameraOn(true)
          return
        } catch {
          continue
        }
      }
    }
    captureRef.current?.click()
  }

  function snap() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        void take(new File([blob], "camera.jpg", { type: "image/jpeg" }))
        stopCamera()
      },
      "image/jpeg",
      0.9,
    )
  }

  async function take(file: File | undefined) {
    if (!file) return
    const dataUrl = await compress(file, 900)
    if (!dataUrl) {
      onError("Rasm formati qo'llab-quvvatlanmaydi")
      return
    }
    onPhoto(dataUrl)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <label className="btn-line relative cursor-pointer text-center">
          Fayldan
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            type="file"
            accept="image/*"
            onChange={(event) => {
              void take(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </label>
        <button className="btn-line" type="button" onClick={openCamera}>
          Kameradan
        </button>
        <input
          ref={captureRef}
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            void take(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </div>
      {cameraOn ? (
        <div className="mt-2">
          <video ref={videoRef} className="h-48 w-full rounded-xl object-cover" autoPlay muted playsInline />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className="btn-ghost" type="button" onClick={stopCamera}>
              Bekor
            </button>
            <button className="btn" type="button" onClick={snap}>
              Olish
            </button>
          </div>
        </div>
      ) : null}
      {preview && !cameraOn ? (
        <div className="relative mt-2">
          <img className="h-36 w-full rounded-xl bg-black/25 object-contain" src={preview} alt="" />
          <button
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-lg leading-none text-white"
            type="button"
            aria-label="Rasmni olib tashlash"
            onClick={() => onPhoto(null)}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  )
}
