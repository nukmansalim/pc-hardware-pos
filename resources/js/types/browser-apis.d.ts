// =============================================================================
// browser-apis.d.ts — Ambient type declarations for browser hardware APIs
// Covers: Web Serial API, WebUSB API
//
// These APIs are not fully typed in TypeScript's DOM lib yet.
// Sources:
//   Web Serial: https://wicg.github.io/serial/
//   WebUSB:     https://wicg.github.io/webusb/
// =============================================================================

// ---------------------------------------------------------------------------
// Web Serial API
// ---------------------------------------------------------------------------

interface SerialPortInfo {
    usbVendorId?: number
    usbProductId?: number
}

interface SerialOptions {
    baudRate: number
    dataBits?: 7 | 8
    stopBits?: 1 | 2
    parity?: 'none' | 'even' | 'odd'
    bufferSize?: number
    flowControl?: 'none' | 'hardware'
}

interface SerialPortFilter {
    usbVendorId?: number
    usbProductId?: number
}

interface SerialPortRequestOptions {
    filters?: SerialPortFilter[]
}

interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null
    readonly writable: WritableStream<Uint8Array> | null
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
    getInfo(): SerialPortInfo
}

interface Serial extends EventTarget {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
    getPorts(): Promise<SerialPort[]>
}

interface Navigator {
    readonly serial: Serial
}

// ---------------------------------------------------------------------------
// WebUSB API
// ---------------------------------------------------------------------------

interface USBDeviceFilter {
    vendorId?: number
    productId?: number
    classCode?: number
    subclassCode?: number
    protocolCode?: number
    serialNumber?: string
}

interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[]
}

interface USBEndpoint {
    endpointNumber: number
    direction: 'in' | 'out'
    type: 'bulk' | 'interrupt' | 'isochronous'
    packetSize: number
}

interface USBAlternateInterface {
    alternateSetting: number
    interfaceClass: number
    interfaceSubclass: number
    interfaceProtocol: number
    interfaceName: string | null
    endpoints: USBEndpoint[]
}

interface USBInterface {
    interfaceNumber: number
    alternate: USBAlternateInterface
    alternates: USBAlternateInterface[]
    claimed: boolean
}

interface USBConfiguration {
    configurationValue: number
    configurationName: string | null
    interfaces: USBInterface[]
}

interface USBDevice {
    readonly usbVersionMajor: number
    readonly usbVersionMinor: number
    readonly usbVersionSubminor: number
    readonly deviceClass: number
    readonly deviceSubclass: number
    readonly deviceProtocol: number
    readonly vendorId: number
    readonly productId: number
    readonly deviceVersionMajor: number
    readonly deviceVersionMinor: number
    readonly deviceVersionSubminor: number
    readonly manufacturerName: string | null
    readonly productName: string | null
    readonly serialNumber: string | null
    readonly configuration: USBConfiguration | null
    readonly configurations: USBConfiguration[]
    readonly opened: boolean
    open(): Promise<void>
    close(): Promise<void>
    selectConfiguration(configurationValue: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    releaseInterface(interfaceNumber: number): Promise<void>
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>
    transferOut(endpointNumber: number, data: ArrayBufferView): Promise<USBOutTransferResult>
    reset(): Promise<void>
}

interface USBInTransferResult {
    data?: DataView
    status: 'ok' | 'stall' | 'babble'
}

interface USBOutTransferResult {
    bytesWritten: number
    status: 'ok' | 'stall'
}

interface USB extends EventTarget {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
    getDevices(): Promise<USBDevice[]>
}

interface Navigator {
    readonly usb: USB
}
