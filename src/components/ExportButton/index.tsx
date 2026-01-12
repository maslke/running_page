import React, { useState, useCallback } from 'react';
import styles from './style.module.css';

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename?: string;
  className?: string;
  filterClassName?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  targetRef,
  filename = 'export',
  className,
  filterClassName,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!targetRef.current || isExporting) {
        return;
      }
      setIsExporting(true);
      try {
        const { domToPng } = await import('modern-screenshot');
        const rect = targetRef.current.getBoundingClientRect();
        const dataUrl = await domToPng(targetRef.current, {
          scale: 2,
          width: rect.width,
          height: rect.height,
          backgroundColor: null,
          style: {
            margin: '0',
            transform: 'none',
          },
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains(styles.exportButton)) return false;
              if (filterClassName && node.classList.contains(filterClassName))
                return false;
            }
            return true;
          },
        });

        const link = document.createElement('a');
        link.download = `${filename.replace(/[/\\:]/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    },
    [targetRef, isExporting, filename, filterClassName]
  );

  return (
    <button
      className={`${styles.exportButton} ${className || ''}`}
      onClick={handleExport}
      title="导出为图片"
      disabled={isExporting}
    >
      {isExporting ? (
        <span className={styles.exportSpinner} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
    </button>
  );
};

export default ExportButton;
