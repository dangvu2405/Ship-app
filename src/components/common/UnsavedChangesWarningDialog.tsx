import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';

export type UnsavedChangesWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms leaving without saving (then close parent form). */
  onConfirmDiscard: () => void;
};

/**
 * Common warning when closing a form dialog while fields were touched.
 * Stacks above {@link Dialog} via higher z-index on overlay + content.
 */
export function UnsavedChangesWarningDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
}: UnsavedChangesWarningDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        overlayClassName="z-[60] bg-black/20 supports-backdrop-filter:backdrop-blur-xs"
        className="z-[61] border-warning/30 bg-popover shadow-lg ring-warning/20 sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-warning/15 text-warning [&_svg]:text-warning">
            <AlertTriangle className="size-6 shrink-0" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('unsavedChanges.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('unsavedChanges.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">{t('unsavedChanges.stay')}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="outline"
            className="border-warning/50 bg-warning/10 text-warning-foreground hover:bg-warning/20"
            onClick={() => {
              onConfirmDiscard();
            }}
          >
            {t('unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
