interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen }: Props) {
  if (!isOpen) return null;
  return null;
}
