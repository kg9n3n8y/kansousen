import { getDownloadInstructionMessage } from '../utils/downloadBoard';
import { Modal } from './Modal';
import { Button } from './Button';

interface DownloadDialogProps {
  open: boolean;
  dataUrl: string;
  fileName: string;
  title: string;
  onClose: () => void;
}

export function DownloadDialog({ open, dataUrl, fileName, title, onClose }: DownloadDialogProps) {
  const pngName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="画像を保存"
      wide
      footer={
        <Button variant="secondary" fullWidth onClick={onClose}>
          閉じる
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-card bg-ai-light p-4">
          <img
            src={dataUrl}
            alt={title ? `${title} のダウンロード用画像` : 'ダウンロード用の盤面画像'}
            className="w-full rounded-xl shadow-card"
          />
        </div>
        <p className="text-center text-sm text-muted">{getDownloadInstructionMessage()}</p>
        <a
          href={dataUrl}
          download={pngName}
          className="flex justify-center rounded-full bg-ai-light px-6 py-2.5 font-semibold text-ai no-underline transition hover:bg-ai/20"
        >
          画像を保存
        </a>
      </div>
    </Modal>
  );
}
