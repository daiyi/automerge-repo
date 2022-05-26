import DocHandle from './DocHandle.js'
/* global Automerge */

export default class Repo extends EventTarget {
  handles = {}
  storageSubsystem

  // TODO: There's a weird asymmetry here where the storage subsystem
  //       wants to be told when a document changes to decide if it should save but the
  //       Repo needs to have direct access to the storage subsystem to load...
  constructor(storageSubsystem) {
    super()
    this.storageSubsystem = storageSubsystem
  }

  cacheHandle(documentId) {
    if (this.handles[documentId]) {
      return this.handles[documentId]
    }
    const handle = new DocHandle(documentId)
    this.handles[documentId] = handle
    return handle
  }

  /* this is janky, because it returns an empty (but editable) document
   * before anything loads off the network.
   * fixing this probably demands some work in automerge core.
   */
  async load(documentId) {
    const handle = this.cacheHandle(documentId)
    handle.replace(await this.storageSubsystem.load(documentId) || Automerge.init())
    this.dispatchEvent(new CustomEvent('document', { detail: { handle } }))
    return handle
  }

  create() {
    const documentId = crypto.randomUUID()
    const handle = this.cacheHandle(documentId)
    handle.replace(Automerge.init())
    this.dispatchEvent(new CustomEvent('document', { detail: { handle } }))
    return handle
  }

  /**
   * find() locates a document by id
   * getting data from the local system but also by sending out a 'document'
   * event which a CollectionSynchronizer would use to advertise interest to other peers
   * @param {string} documentId
   * @returns DocHandle
   */
  async find(documentId) {
    return this.handles[documentId] || this.load(documentId)
  }
}