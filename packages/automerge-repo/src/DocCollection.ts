import EventEmitter from "eventemitter3"
import { v4 as uuid } from "uuid"
import { DocHandle } from "./DocHandle"
import { DocumentId } from "./types"

/**
 * A DocCollection is a collection of DocHandles. It supports creating new documents and finding
 * documents by ID.
 * */
export class DocCollection extends EventEmitter<DocCollectionEvents> {
  handles: Record<DocumentId, DocHandle<unknown>> = {}

  constructor() {
    super()
  }

  /** Returns an existing handle if we have it; creates one otherwise. */
  private handleFromCache(
    /** The documentId of the handle to look up or create */
    documentId: DocumentId,

    /** If we know we're creating a new document, specify this so we can have access to it immediately */
    isNew: boolean
  ) {
    // If we have the handle cached, return it
    if (this.handles[documentId]) return this.handles[documentId]

    // If not, create a new handle, cache it, and return it
    const handle = new DocHandle<unknown>(documentId, isNew)
    this.handles[documentId] = handle
    return handle
  }

  /**
   * Creates a new document and returns a handle to it. The initial value of the document is
   * an empty object `{}`. Its documentId is generated by the system. we emit a `document` event
   * to advertise interest in the document.
   */
  create<T>(): DocHandle<T> {
    // TODO:
    // either
    // - pass an initial value and do something like this to ensure that you get a valid initial value

    // const myInitialValue = {
    //   tasks: [],
    //   filter: "all",
    // }

    // const guaranteeInitialValue = (doc: any) => {
    // if (!doc.tasks) doc.tasks = []
    // if (!doc.filter) doc.filter = "all"

    //   return { ...myInitialValue, ...doc }
    // }

    // or
    // - pass a "reify" function that takes a `<any>` and returns `<T>`

    const documentId = uuid() as DocumentId
    const handle = this.handleFromCache(documentId, true) as DocHandle<T>
    this.emit("document", { handle })
    return handle
  }

  /**
   * Retrieves a document by id. It gets data from the local system, but also by emits a `document`
   * event to advertise interest in the document.
   */
  find<T>(
    /** The documentId of the handle to retrieve */
    documentId: DocumentId
  ): DocHandle<T> {
    // TODO: we want a way to make sure we don't yield intermediate document states during initial synchronization

    // If we already have a handle, return it
    if (this.handles[documentId])
      return this.handles[documentId] as DocHandle<T>

    // Otherwise, create a new handle
    const handle = this.handleFromCache(documentId, false) as DocHandle<T>

    // we don't directly initialize a value here because the StorageSubsystem and Synchronizers go
    // and get the data asynchronously and block on read instead of on create

    // emit a document event to advertise interest in this document
    this.emit("document", { handle })

    return handle
  }
}

// events & payloads

export interface DocCollectionEvents {
  document: (payload: DocumentPayload<unknown>) => void
}

export interface DocumentPayload<T> {
  handle: DocHandle<T>
}
