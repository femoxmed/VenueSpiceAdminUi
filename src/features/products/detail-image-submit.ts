import { deleteUploadedFile, uploadFileAndWait } from './api';
import type {
	ProductDetailImageField,
	StagedProductDetailImages,
} from './detail-fields';
import { detailImageKey } from './detail-fields';
import type { ProductFormState } from './form';

type DetailImageItem = {
	image?: { key?: string; url?: string };
	imageUrl?: string;
};

export async function applyStagedDetailImages(
	form: ProductFormState,
	stagedImages: StagedProductDetailImages,
) {
	const nextForm = { ...form };

	for (const field of ['colors', 'features', 'boxItems'] as const) {
		const items = parseArray<DetailImageItem>(nextForm[field]);

		for (let index = 0; index < items.length; index += 1) {
			const staged = stagedImages[detailImageKey(field, index)];
			if (!staged) continue;

			const upload = await uploadFileAndWait(staged.file);
			items[index] = {
				...items[index],
				image: upload,
				imageUrl: upload.url,
			};
		}

		nextForm[field] = JSON.stringify(items, null, 2);
	}

	return nextForm;
}

export async function deleteRemovedDetailImages(
	images: Array<{ key?: string } | undefined>,
) {
	const keys = Array.from(
		new Set(images.map((image) => image?.key).filter(Boolean) as string[]),
	);

	await Promise.allSettled(keys.map((key) => deleteUploadedFile(key)));
}

export function removeStagedDetailImage(
	stagedImages: StagedProductDetailImages,
	field: ProductDetailImageField,
	index: number,
) {
	const next = { ...stagedImages };
	delete next[detailImageKey(field, index)];
	return next;
}

function parseArray<T>(value: string): T[] {
	try {
		const parsed = JSON.parse(value || '[]');
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
