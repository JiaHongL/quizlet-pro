import { CommonModule, DOCUMENT } from '@angular/common';
import { ApplicationRef, ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { EventManagerServiceService } from './shared/services/event-manager-service.service';
import { InjectionToken } from '@angular/core';
import { Action } from './enum/action.enum';

import { Subject, debounceTime } from 'rxjs';
import { MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

export const WINDOW = new InjectionToken<Window>('Global window object', {
  factory: () => window
});

@Component({
  selector: 'content-app-root',
  standalone: true,
  providers: [
    EventManagerServiceService,
    MessageService
  ],
  imports: [
    CommonModule,
    ToastModule
  ],
  template: `
      <p-toast></p-toast>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentAppComponent {

  messageService = inject(MessageService);
  eventManagerServiceService = inject(EventManagerServiceService);
  private eventRemovers: Function[] = [];
  private document: Document = inject(DOCUMENT);
  private window: Window = inject(WINDOW);
  action = Action;
  appRef: ApplicationRef = inject(ApplicationRef);

  gamePadClickSubject = new Subject<number>();
  axisSubject = new Subject<number>();

  constructor() {
    effect(async () => {
      this.eventRemovers = this.eventManagerServiceService.addMultipleEvents(this.window,
        [
          { event: 'keydown', callback: (e: any) => this.onTestPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onLearnPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onDetailPageKeydown(e) },
          { event: 'keydown', callback: (e: any) => this.onFlashcardPageKeydown(e) },
        ]
      );
      this.addGamePadConnectedEventListener();

      if (window.location.pathname.includes('/decks/query')) {
        let intervalID = setInterval(() => {
          // 查詢 document.body 中包含 "其他卡堆" 文字的 div 元素
          const divsWithText = document.querySelectorAll('.text-sm.text-grayscale-1100');
          const urlParams = new URLSearchParams(window.location.search);
          const queryWord = urlParams.get('queryStr')?.replace(/\s+/g, '')
          // 過濾出包含特定文字的 div
          const targetDiv = Array.from(divsWithText).find(div => div?.textContent == queryWord) as HTMLElement;
          if (targetDiv) {
            clearInterval(intervalID);
            targetDiv?.click();
          }
        }, 300)
      }

    });
    // 初始化
    chrome.runtime.sendMessage({ action: Action.CONTEXT_APP_INIT });
    // 監聽 popup 發送的訊息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case Action.ENLARGE_EN_TEXT_FONT_SIZE_OF_THE_LIST:
          this.setListFontSizeAndKK();
          break;
        case Action.GAME_CONTROLLER_CONNECTION_CHECK:
          this.addGamePadConnectedEventListener();
          break;
        default:
          break;
      }
      // 保持 sendResponse 一直是 true
      return true;
    });

    this.gamePadClickSubject.subscribe((buttonIndex) => {
      this.onLearnPageGamePadClick(buttonIndex);
      this.onTextPageGamePadClick(buttonIndex);
      this.onDetailPageGamePadClick(buttonIndex);
      this.onFlashcardPageGamePadClick(buttonIndex);
      this.onWordUpPageGamePadClick(buttonIndex);
    });
    this
      .axisSubject
      .pipe(
        debounceTime(100)
      )
      .subscribe((axis) => {
        this.gamePadClickSubject.next(axis);
      });
  }


  addGamePadConnectedEventListener() {
    if (navigator.getGamepads()[0]?.id.includes('Switch Pro Controller')) {
      chrome.runtime.sendMessage({ action: this.action.GAME_CONTROLLER_CONNECTION_SUCCESS });
      return;
    }
    window.addEventListener("gamepadconnected", this.gamepadEventHandler);
  }

  lastButtons: any[] = [];

  gamepadEventHandler = (e: GamepadEvent) => {
    chrome.runtime.sendMessage({ action: this.action.GAME_CONTROLLER_CONNECTION_SUCCESS });
    this.messageService.add({
      severity: 'success',
      summary: '提示',
      detail: 'switch pro 手把，連線成功！',
    })
    this.appRef.tick();
    requestAnimationFrame(this.updateGamepads);
  }

  updateGamepads = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let gamepad of gamepads) {
      if (gamepad) {
        if (!this.lastButtons[gamepad.index]) {
          this.lastButtons[gamepad.index] = [];
        }
        gamepad.buttons.forEach((button, index) => {
          if (button.pressed) {
            if (!this.lastButtons[gamepad.index]) {
              this.lastButtons[gamepad.index] = [];
            }
            if (!this.lastButtons[gamepad.index][index]) {
              this.lastButtons[gamepad.index][index] = true;
              // console.log(`按鈕 ${index} 被按下`);
              this.gamePadClickSubject.next(index);
            }
          } else {
            if (this.lastButtons[gamepad.index] && this.lastButtons[gamepad.index][index]) {
              this.lastButtons[gamepad.index][index] = false;
              // console.log(`按鈕 ${index} 被釋放`);
            }
          }
        });
        // 處理左搖桿的水平與垂直移動
        const xAxis = gamepad.axes[0];  // 第一軸是水平移動
        const yAxis = gamepad.axes[1];  // 第二軸是垂直移動

        if (xAxis < -0.5) {
          // 搖桿向左
          this.axisSubject.next(-99);
        } else if (xAxis > 0.5) {
          // 搖桿向右
          this.axisSubject.next(99);
        }

        if (yAxis < -0.5) {
          // 搖桿向上
          this.axisSubject.next(88);
        } else if (yAxis > 0.5) {
          // 搖桿向下
          this.axisSubject.next(-88);
        }

        // 處理右搖桿的水平與垂直移動
        const rightXAxis = gamepad.axes[2];  // 第三軸是水平移動
        const rightYAxis = gamepad.axes[3];  // 第四軸是垂直移動

        if (rightXAxis < -0.5) {
          // 右搖桿向左
          this.axisSubject.next(-99);
        } else if (rightXAxis > 0.5) {
          // 右搖桿向右
          this.axisSubject.next(99);
        }

        if (rightYAxis < -0.5) {
          // 右搖桿向上
          this.axisSubject.next(88);
        } else if (rightYAxis > 0.5) {
          // 右搖桿向下
          this.axisSubject.next(-88);
        }

      }
    }
    requestAnimationFrame(this.updateGamepads); // 繼續檢查狀態
  }

  onWordUpPageGamePadClick(buttonIndex: number) {
    if (!window.location.pathname.includes('/decks/')) {
      return;
    }
    switch (buttonIndex) {
      case 13:
      case -88:
        chrome.runtime.sendMessage({ action: this.action.CLOSE_WINDOW });
        break;
      case 12:
      case 14:
      case 88:
      case -99:
        if (window.location.pathname.includes('/decks/query')) {
          (this.document?.body?.querySelector('.bg-grayscale-000.rounded-lg.shadow-md')?.children[0] as HTMLElement)?.click();
        } else {
          const enText = this.document?.querySelector('.text-grayscale-800.font-bold.break-all.font-noto')?.textContent?.toLowerCase();
          const soundButton = this.document.querySelector('[alt$="' + enText + '-us"]') as HTMLElement;
          soundButton?.click();
        }
        break;
      default:
        break;
    }
  }

  onLearnPageGamePadClick(buttonIndex: number) {
    if (!this.window.location.href.includes('/learn')) { return; }
    const soundButton = this.document.querySelector('[aria-label="sound"]') as HTMLElement;
    const continueButton = this.document.querySelector('[aria-label="繼續"]') as HTMLElement;
    const mcqAnswers = this.document.querySelector('[data-testid="MCQ Answers"]');
    switch (buttonIndex) {
      case 0:
        (mcqAnswers?.childNodes[3] as HTMLElement)?.click();
        continueButton?.click();
        break;
      case 1:
        (mcqAnswers?.childNodes[2] as HTMLElement)?.click();
        continueButton?.click();
        break;
      case 2:
        (mcqAnswers?.childNodes[0] as HTMLElement)?.click();
        continueButton?.click();
        break;
      case 3:
        (mcqAnswers?.childNodes[1] as HTMLElement)?.click();
        continueButton?.click();
        break;
      case 4:
      case 6:
        soundButton?.click();
        break;
      case 5:
      case 7:
        soundButton?.click();
        continueButton?.click();
        break;
      case 8:
      case 15:
      case 99:
        chrome.runtime.sendMessage({
          action: this.action.WORD_UP_QUERY,
          queryWord: this.document.querySelector('.lang-en')?.textContent + ' '
        });
        break;
      default:
        break;
    }
  }

  onLearnPageKeydown(event: KeyboardEvent) {
    if (!this.window.location.href.includes('/learn?')) { return; }
    const soundButton = this.document.querySelector('[aria-label="sound"]') as HTMLElement;
    switch (event.key) {
      case '5':
      case ' ':
        soundButton?.click();
        break;
      default:
        break;
    }
  }

  onTextPageGamePadClick(buttonIndex: number) {
    if (!this.window.location.href.includes('/test')) { return; }
    var currentItemIndex = Number(document?.querySelector('.qzk5crt')?.textContent?.split('/')[0]?.trim());
    const mcqAnswers = this.document.querySelectorAll('[role="listitem"]')[currentItemIndex]?.querySelector('[data-testid="MCQ Answers"]');
    const sections = this.document.querySelectorAll('[role="listitem"]')[currentItemIndex]?.querySelectorAll('section');
    const soundButton = this.document.querySelectorAll('[role="listitem"]')[currentItemIndex]?.querySelector('[aria-label="sound"]') as HTMLElement;

    switch (buttonIndex) {
      // 下
      case 0:
        if (mcqAnswers) {
          (mcqAnswers.childNodes[3] as HTMLElement).click();
        }
        break;
      // 右
      case 1:
        if (mcqAnswers) {
          (mcqAnswers.childNodes[2] as HTMLElement).click();
          return;
        }
        if (sections) {
          (sections[3] as HTMLElement).click();
        }
        break;
      // 左
      case 2:
        if (mcqAnswers) {
          (mcqAnswers.childNodes[0] as HTMLElement).click();
          return;
        }
        if (sections) {
          (sections[2] as HTMLElement).click();
        }
        break;
      // 上
      case 3:
        if (mcqAnswers) {
          (mcqAnswers.childNodes[1] as HTMLElement).click();
        }
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        soundButton?.click();
        break;
      default:
        break;
    }
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
      case '5':
        soundButton?.click();
        break;
      default:
        break;
    }

  }

  onDetailPageGamePadClick(buttonIndex: number) {
    if (!this.window.location.pathname.includes('/tw/')) {
      return;
    }

    const termText = this.document.querySelector('.SetPageTerms-term')?.querySelector('[data-testid=set-page-card-side]')?.querySelector('.TermText') as HTMLElement;
    const starButton = this.document.querySelector('.SetPageTerms-term')?.querySelector('[aria-label="星號標記"]') as HTMLElement;

    switch (buttonIndex) {
      case 0:
      case 1:
      case 2:
      case 3:
        starButton?.click();
        break;
      case 4:
      case 6:
      case 5:
      case 7:
        termText?.click();
        break;
      case 9:
        this.setListFontSizeAndKK();
        break;
      default:
        break;
    }
  }

  onDetailPageKeydown(event: KeyboardEvent) {
    if (!this.window.location.pathname.includes('/tw/')) {
      return;
    }

    const termText = this.document.querySelector('.SetPageTerms-term')?.querySelector('[data-testid=set-page-card-side]')?.querySelector('.TermText') as HTMLElement;
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

  async speak(text: string, isTwVoice = false) {
    const storage = await chrome.storage.local.get(['voice', 'pitch', 'rate', 'volume']);
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.name === storage['voice']);
    if (isTwVoice) {
      selectedVoice = voices.find(voice => voice.name.includes('HsiaoChen'));
    }
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice as any;
    if (!isTwVoice) {
      utterance.pitch = storage['pitch'];
      utterance.rate = storage['rate'];
      utterance.volume = storage['volume'];
    }
    this.window.speechSynthesis.cancel();
    this.window.speechSynthesis.speak(utterance);
  }

  onFlashcardPageGamePadClick(buttonIndex: number) {
    if (!this.window.location.pathname.includes('/flashcards')) {
      return;
    }
    const enText = this.document.querySelector('.lang-en')?.childNodes[0].textContent as string;
    const twText = this.document.querySelector('.lang-zh-TW')?.childNodes[0].textContent as string;
    const starButton = this.document.querySelector('[aria-label="star filled"]') as HTMLElement;
    const previousButton = this.document.querySelector('[aria-label="按下以學習上一張單詞卡"]') as HTMLElement;
    const nextButton = this.document.querySelector('[aria-label="按下以學習下一張單詞卡"]') as HTMLElement;

    switch (buttonIndex) {
      case 3:
        starButton.click();
        break;
      case 0:
        this.speak(twText, true);
        break;
      case 2:
        this.speak(enText, true);
        break;
      case 1:
      case 4:
      case 5:
        this.speak(enText);
        break;
      case 15:
      case 99:
        chrome.runtime.sendMessage({
          action: this.action.WORD_UP_QUERY,
          queryWord: this.document.querySelector('.lang-en')?.textContent + ' '
        });
        break;
      case 6:
        previousButton.click();
        setTimeout(() => {
          const preEnText = this.document.querySelector('.lang-en')?.childNodes[0].textContent as string;
          this.speak(preEnText);
        }, 200);
        break;
      case 7:
        nextButton.click();
        setTimeout(() => {
          const nextEnText = this.document.querySelector('.lang-en')?.childNodes[0].textContent as string;
          this.speak(nextEnText);
        }, 200);
        break;
      case 9:
        for (let i = 0; i < 2000; i++) {
          setTimeout(() => {
            (this.document.querySelector('[aria-label="star filled"]') as HTMLElement)?.click();
            setTimeout(() => {
              nextButton?.click();
            });
          }, 300 * i);
        }
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
    const starButton = this.document.querySelector('[aria-label="star filled"]') as HTMLElement;

    switch (event.key) {
      case 'x':
        starButton.click();
        break;
      case 'z':
        const storage = await chrome.storage.local.get(['voice', 'pitch', 'rate', 'volume']);
        const voices = speechSynthesis.getVoices();
        let selectedVoice = voices.find(voice => voice.name === storage['voice']);
        let utterance = new SpeechSynthesisUtterance(enText);
        utterance.voice = selectedVoice as any;
        utterance.pitch = storage['pitch'];
        utterance.rate = storage['rate'];
        utterance.volume = storage['volume'];
        // 播放語音
        this.window.speechSynthesis.cancel();
        this.window.speechSynthesis.speak(utterance);
        break;
      default:
        // 按下了其他鍵
        break;
    }

  }

  setListFontSizeAndKK() {
    this.document.querySelectorAll('.TermText.lang-en').forEach((element: any, index) => {
      const word = element.textContent;
      element.style = 'font-size:30px';
      const parentElement = element.parentElement;
      let ms = 500 * index;
      if (index > 200) {
        ms = 1000 * index;
      }
      setTimeout(() => {
        chrome.runtime.sendMessage(
          {
            contentScriptQuery: "fetchUrl",
            url: "https://tw.dictionary.search.yahoo.com/search?p=" + word + "&fr2=dict",
            responseType: "text"
          },
          response => {
            const pattern = /KK\[[^\]]+\]/g;
            const matches = response.data.match(pattern);
            parentElement.insertAdjacentHTML('beforeend', '<div><small style="color:#A7A7A7">' + matches[0].replace('KK', '') + '</small></div>');
          });
      }, ms);

    });

  }

  ngOnDestroy() {
    // 移除所有事件監聽器
    this.eventRemovers.forEach(remove => remove());
  }

}
