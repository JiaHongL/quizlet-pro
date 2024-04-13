import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ComponentRef, Renderer2, ViewContainerRef, effect, inject } from '@angular/core';
import { EventManagerServiceService } from './shared/services/event-manager-service.service';
import { InjectionToken } from '@angular/core';
import { Action } from './enum/action.enum';
export const WINDOW = new InjectionToken<Window>('Global window object', {
  factory: () => window
});


@Component({
  selector: 'content-app-root',
  standalone: true,
  providers: [EventManagerServiceService],
  imports: [
    CommonModule,
  ],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentAppComponent {

  eventManagerServiceService = inject(EventManagerServiceService);
  private eventRemovers: Function[] = [];
  private renderer: Renderer2 = inject(Renderer2);
  private document: Document = inject(DOCUMENT);
  private window: Window = inject(WINDOW);

  constructor() {
    effect(() => {
      this.eventRemovers = this.eventManagerServiceService.addMultipleEvents(this.window,
        [
          { event: 'keydown', callback: (e: any) => this.onTestPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onLearnPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onDetailPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onFlashcardPageKeydown(e) },
        ]
      );
    });
    // 初始化
    chrome.runtime.sendMessage({ action: Action.CONTEXT_APP_INIT });
    // 監聽 popup 發送的訊息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse)=> {
      switch (request.action) {
        case Action.ENLARGE_EN_TEXT_FONT_SIZE_OF_THE_LIST:
          this.setListFontSize();
          break;
        default:
          break;
      }
      // 保持 sendResponse 一直是 true
      return true;
    });
  }

  onTestPageKeydown(event: KeyboardEvent) {

    if (!this.window.location.pathname.includes('test')) { return; }

    var currentItemIndex = Number(document?.querySelector('.qzk5crt')?.textContent?.split('/')[0]?.trim());
    const mcqAnswers = this.document.querySelectorAll('[role="listitem"]')[currentItemIndex]?.querySelector('[data-testid="MCQ Answers"]');
    const soundButton = this.document.querySelectorAll('[role="listitem"]')[currentItemIndex]?.querySelector('[aria-label="sound"]') as HTMLElement;

    switch (event.key) {
      case '1':
        if (mcqAnswers) {
          (mcqAnswers.childNodes[0] as HTMLElement).click();
        }
        break;
      case '2':
        if (mcqAnswers) {
          (mcqAnswers.childNodes[1] as HTMLElement).click();
        }
        break;
      case '3':
        if (mcqAnswers) {
          (mcqAnswers.childNodes[2] as HTMLElement).click();
        }
        break;
      case '4':
        if (mcqAnswers) {
          (mcqAnswers.childNodes[3] as HTMLElement).click();
        }
        break;
      case '0':
        soundButton?.click();
        break;
      default:
        break;
    }

  }

  onLearnPageKeydown(event: KeyboardEvent) {
    if (!this.window.location.href.includes('/learn?')) { return; }
    const soundButton = this.document.querySelector('[aria-label="sound"]') as HTMLElement;
    switch (event.key) {
      case '0':
        soundButton?.click();
        break;
      default:
        break;
    }
  }

  onDetailPageKeydown(event: KeyboardEvent) {
    if (!this.window.location.pathname.includes('/tw/')) {
      return;
    }

    const termText = this.document.querySelector('.SetPageTerms-term')?.querySelector('[data-testid=set-page-card-side]')?.querySelector('.TermText')  as HTMLElement;
    const starButton = this.document.querySelector('.SetPageTerms-term')?.querySelector('[aria-label="星號標記"]') as HTMLElement;

    switch (event.key) {
      case 'n':
        termText.click();
        break;
      case 'm':
        starButton.click();
        break;
      default:
        // 按下了其他鍵
        break;
    }

  }

  async onFlashcardPageKeydown(event: KeyboardEvent) {
    if (!this.window.location.pathname.includes('/flashcards')) {
      return;
    }

    const enText = this.document.querySelector('.lang-en')?.childNodes[0].textContent as string;

    switch (event.key) {
      case 'x':
        const storage = await chrome.storage.local.get(['voice', 'pitch', 'rate', 'volume']);
        const voices = speechSynthesis.getVoices();
        let selectedVoice = voices.find(voice => voice.name === storage['voice']);
        let utterance = new SpeechSynthesisUtterance(enText);
        utterance.voice = selectedVoice as any;
        utterance.pitch = storage['pitch'];
        utterance.rate = storage['rate'];
        utterance.volume = storage['volume'];
        // 播放語音
        this.window.speechSynthesis.speak(utterance);
        break;
      default:
        // 按下了其他鍵
        break;
    }

  }


  setListFontSize() {
    this.document.querySelectorAll('.TermText.lang-en').forEach((element:any)=>{
      element.style = 'font-size:30px';
    });
  }

  ngOnDestroy() {
    // 移除所有事件監聽器
    this.eventRemovers.forEach(remove => remove());
  }

}
