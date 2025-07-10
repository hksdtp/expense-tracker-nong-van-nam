import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  // Lấy các đường dẫn cần revalidate
  const searchParams = request.nextUrl.searchParams
  const paths = searchParams.getAll("path")
  
  if (!paths.length) {
    return NextResponse.json(
      { revalidated: false, message: "Không có đường dẫn được chỉ định" },
      { status: 400 }
    )
  }

  try {
    // Revalidate từng đường dẫn
    for (const path of paths) {
      console.log(`Đang revalidate đường dẫn: ${path}`)
      revalidatePath(path)
    }

    console.log(`Đã revalidate thành công ${paths.length} đường dẫn`)
    
    return NextResponse.json({
      revalidated: true,
      message: `Đã revalidate thành công: ${paths.join(", ")}`
    })
  } catch (error) {
    console.error("Lỗi khi revalidate:", error)
    return NextResponse.json(
      { revalidated: false, message: "Lỗi khi revalidate" },
      { status: 500 }
    )
  }
}
