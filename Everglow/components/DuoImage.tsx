import { mediaUrl } from "@/lib/media";

/** A Moitié-moitié photo: two halves (already cropped) side by side, or one half waiting for its partner. */
export function DuoImage({ left, right, rightSlot }: { left: string; right?: string | null; rightSlot?: React.ReactNode }) {
  return (
    <div className="duo cropped">
      <div className="half left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={left.startsWith("blob:") ? left : mediaUrl(left)} alt="" />
      </div>
      {right ? (
        <div className="half right">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={right.startsWith("blob:") ? right : mediaUrl(right)} alt="" />
        </div>
      ) : (
        rightSlot ?? <div className="half empty"><b>?</b>Ta moitié</div>
      )}
      <span className="seam" />
    </div>
  );
}
