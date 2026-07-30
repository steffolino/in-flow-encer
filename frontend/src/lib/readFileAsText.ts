/**
 * Reads a File as text using FileReader rather than `File.prototype.text()`.
 * `.text()` is unreliable across test environments (jsdom does not always
 * implement it), while FileReader is universally supported.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => {
      reject(new Error('Could not read the selected file.'))
    }
    reader.readAsText(file)
  })
}
