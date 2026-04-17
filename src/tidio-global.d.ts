/** Tidio chat widget (https://www.tidio.com/) injected at runtime */
export {};

declare global {
  interface Window {
    tidioChatApi?: {
      open(): void;
      messageFromVisitor(message: string): void;
      setVisitorData?(data: { tags?: string[] }): void;
    };
  }

  interface Document {
    tidioIdentify?: {
      distinct_id?: string;
      email?: string;
      name?: string;
    };
  }
}
