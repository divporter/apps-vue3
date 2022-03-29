import type { Attachment } from "./attachments"

export type FilesElementFile = {
  data: string
  fileName: string
}

export type PossibleFileConfiguration = Attachment | FilesElementFile
