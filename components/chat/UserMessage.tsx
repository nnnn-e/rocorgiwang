import type { Attachment } from "@/types"

interface UserMessageProps {
  content: string
  attachments?: Attachment[]
  isMobile: boolean
}

export default function UserMessage({ content, attachments, isMobile }: UserMessageProps) {
  return (
    <div
      className={`${isMobile ? "max-w-[90%]" : "max-w-full"} user-message px-4 py-3`}
      style={{
        fontSize: "16px",
        lineHeight: isMobile ? "145%" : "inherit",
        borderRadius: "1rem",
      }}
    >
      {attachments && attachments.length > 0 && (
        <div className="mb-2">
          {attachments.map(
            (attachment, index) =>
              attachment.type?.startsWith("image/") && (
                <div key={index} className="relative rounded-lg overflow-hidden mb-2">
                  <img
                    src={attachment.url || "/placeholder.svg"}
                    alt="Uploaded image"
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
              ),
          )}
        </div>
      )}
      <p className="whitespace-pre-wrap" style={{ lineHeight: "160%" }}>
        {content}
      </p>
    </div>
  )
}
