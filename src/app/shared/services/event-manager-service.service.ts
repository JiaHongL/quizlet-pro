import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';

@Injectable()
export class EventManagerServiceService {

  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);

  // 添加事件監聽器，返回一個函數用於取消監聽
  addEventListener(element: any, event: string, callback: Function): Function {
    return this.renderer.listen(element, event, (evt) => callback(evt));
  }

  // 一次性添加多個事件監聽器
  addMultipleEvents(element: any, events: { event: string, callback: Function }[]): Function[] {
    return events.map(evt => this.addEventListener(element, evt.event, evt.callback));
  }

  // 移除事件監聽器
  removeEventListener(listener: Function): void {
    if (listener) listener();
  }

}