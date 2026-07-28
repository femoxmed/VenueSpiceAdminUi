import React, { useState, useRef, useCallback } from 'react';
import {
	uploadFile,
	getUploadStatus,
	UploadStatusResponse,
} from '@/features/products/api';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
	onUploadComplete?: (
		url: string,
		uploadId: string,
		upload?: UploadStatusResponse,
	) => void;
	onFileSelect?: (file: File, previewUrl: string) => void;
	onUploadStateChange?: (uploading: boolean) => void;
	accept?: string;
	maxSizeMB?: number;
	label?: string;
	immediate?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
	onUploadComplete,
	onFileSelect,
	onUploadStateChange,
	accept = 'image/*',
	maxSizeMB = 10,
	label = 'Upload File',
	immediate = true,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [preview, setPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const pollUploadStatus = useCallback(
		async (uploadId: string) => {
			const maxAttempts = 30;
			let attempts = 0;

			const poll = async (): Promise<void> => {
				attempts++;
				try {
					const status = await getUploadStatus(uploadId);

					if (status.status === 'completed' && status.url) {
						setUploading(false);
						onUploadStateChange?.(false);
						setProgress(100);
						toast.success('File uploaded successfully');
						onUploadComplete?.(status.url, uploadId, status);
						return;
					}

					if (status.status === 'failed') {
						throw new Error(status.errorMessage || 'Upload failed');
					}

					setProgress(Math.min(80, 20 + attempts * 5));

					if (attempts < maxAttempts) {
						setTimeout(poll, 1000);
					} else {
						throw new Error('Upload timed out');
					}
				} catch (err) {
					setUploading(false);
					onUploadStateChange?.(false);
					setProgress(0);
					toast.error(err instanceof Error ? err.message : 'Upload failed');
				}
			};

			setTimeout(poll, 500);
		},
		[onUploadComplete],
	);

	const handleFile = useCallback(
		async (file: File) => {
			if (file.size > maxSizeMB * 1024 * 1024) {
				toast.error(`File size exceeds maximum limit of ${maxSizeMB}MB`);
				return;
			}

			// Generate client side preview
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const previewUrl = e.target?.result as string;
					setPreview(previewUrl);

					if (!immediate && onFileSelect) {
						onFileSelect(file, previewUrl);
					}
				};
				reader.readAsDataURL(file);
			}

			// Only upload immediately if enabled
			if (immediate) {
				setUploading(true);
				onUploadStateChange?.(true);
				setProgress(10);

				try {
					const result = await uploadFile(file);
					setProgress(20);
					pollUploadStatus(result.uploadId);
				} catch (err) {
					setUploading(false);
					onUploadStateChange?.(false);
					setProgress(0);
					setPreview(null);
					toast.error('Failed to start upload');
				}
			}
		},
		[maxSizeMB, pollUploadStatus, immediate, onFileSelect, onUploadStateChange],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
	};

	return (
		<div className='w-full'>
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
				className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}>
				<input
					ref={fileInputRef}
					type='file'
					accept={accept}
					onChange={handleInputChange}
					className='hidden'
				/>

				{preview && !uploading ? (
					<div className='space-y-3'>
						<img
							src={preview}
							alt='Preview'
							className='max-h-40 mx-auto rounded-lg'
						/>
						<p className='text-sm text-gray-500'>Click or drop to replace</p>
					</div>
				) : uploading ? (
					<div className='space-y-3'>
						<div className='w-full bg-gray-200 rounded-full h-2.5'>
							<div
								className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className='text-sm text-gray-600'>Processing image...</p>
					</div>
				) : (
					<div className='space-y-2'>
						<svg
							className='mx-auto h-12 w-12 text-gray-400'
							stroke='currentColor'
							fill='none'
							viewBox='0 0 48 48'>
							<path
								d='M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h20a4 4 0 004-4V16l-8-8z'
								strokeWidth={2}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<path
								d='M28 8v10h10'
								strokeWidth={2}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
						<p className='text-sm font-medium text-gray-700'>{label}</p>
						<p className='text-xs text-gray-500'>
							Drag and drop or click to select
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
