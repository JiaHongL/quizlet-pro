export interface Message {
    action: string;
    data: any;
    url?: string;
    queryWord?: string;
    responseType?: string;
}