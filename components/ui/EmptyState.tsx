export default function EmptyState({ message = '該当するデータが見つかりませんでした' }: { message?: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg">{message}</p>
    </div>
  )
}
