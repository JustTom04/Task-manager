import useStore from "@/frontend/store/useStore";

export default function CreateLabelButton() {
  const setShowLabelModal = useStore(s => s.setShowLabelModal);
  return (
    <button
      className="done"
      onClick={() => setShowLabelModal(true)}
    >
      ➕ Create label
    </button>
  );
}
