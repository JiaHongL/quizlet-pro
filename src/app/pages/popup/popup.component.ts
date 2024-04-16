import { CommonModule } from '@angular/common';
import { ApplicationRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Action } from '../../enum/action.enum';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { Message } from '../../models/message.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    SliderModule,
    InputNumberModule
  ],
  template: `
    <div class="popup-page">
      <div class="flex flex-column">
        <div class="mb-2">
            <div class="shadow-2 p-3 border-round">
                <div class="flex justify-content-between">
                    <div>
                        <span class="text-900 text-xl mb-3 font-medium mb-3"> switch pro 手把</span>
                    </div>
                </div>
                <div>
                  <p-button size="small" label="switch pro 手把連線測試" (onClick)="sendMessage(action.GAME_CONTROLLER_CONNECTION_CHECK)" ></p-button>
                </div>
            </div>
          </div>        
          <div class="mb-2">
              <div class="shadow-2 p-3 border-round">
                  <div class="flex justify-content-between">
                      <div>
                          <span class="text-900 text-xl mb-3 font-medium mb-3">學習集頁面</span>
                      </div>
                  </div>
                  <div>
                    <p-button class="mr-2" size="small" label="列表英文放大+音標" (onClick)="sendMessage(action.ENLARGE_EN_TEXT_FONT_SIZE_OF_THE_LIST)"></p-button>
                  </div>
                  <div>
                    <span class="text-700 line-height-3">N：唸英文。M：星號。</span>
                  </div>
              </div>
          </div>
          <div class="mb-2">
              <div class="shadow-2 p-3 border-round">
                  <div class="flex justify-content-between">
                      <div>
                          <span class="text-900 text-xl mb-3 font-medium mb-3">學習頁</span>
                      </div>
                  </div>
                  <div>
                    <span class="text-700 line-height-3">0：聲音。</span>
                  </div>
              </div>
          </div>
          <div class="mb-2">
              <div class="shadow-2 p-3 border-round">
                  <div class="flex justify-content-between">
                      <div>
                          <span class="text-900 text-xl mb-3 font-medium mb-3">Flashcard</span>
                      </div>
                  </div>
                  <div class="flex mb-2">
                    <div class="flex flex-column mr-2">
                      <label class="text-900 font-medium mb-2 mr-2">
                        人聲
                      </label>
                        <p-dropdown
                          [options]="voices" 
                          [(ngModel)]="selectedVoice"
                          [showClear]="false" 
                          placeholder="Select a Voice"
                          appendTo="body"
                        ></p-dropdown>
                    </div>
                  </div>
                  <div class="flex mb-2">
                    <div class="flex flex-column mr-2">
                      <label class="text-900 font-medium mb-2 mr-2">
                        音量
                      </label>
                      <div>
                        <p-inputNumber 
                          [(ngModel)]="selectVolume" 
                          [showButtons]="true" 
                          mode="decimal" 
                          [min]="0.1" 
                          [max]="1"
                          [step]="0.1"
                        > </p-inputNumber>
                      </div>
                    </div>
                    <div class="flex align-items-end">
                        <p-button size="small" label="測試聲音" (onClick)="playVoice()"></p-button>
                    </div>
                  </div>                  
                  <div class="flex">
                    <div class="flex flex-column mr-2">
                      <label class="text-900 font-medium mb-2 mr-2">
                        音調
                      </label>
                      <div>
                        <p-inputNumber 
                          [(ngModel)]="selectedPitch" 
                          [showButtons]="true" 
                          mode="decimal" 
                          [min]="0.1" 
                          [max]="2"
                          [step]="0.1"
                        > </p-inputNumber>
                      </div>
                    </div>
                    <div class="flex flex-column">
                      <label class="text-900 font-medium mb-2 mr-2">
                        語速
                      </label>
                      <div>
                        <p-inputNumber 
                          [(ngModel)]="selectRate" 
                          [showButtons]="true" 
                          mode="decimal" 
                          [min]="0.1" 
                          [max]="10"
                          [step]="0.1"
                        > </p-inputNumber>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span class="text-700 line-height-3">Z：唸英文。X：星號。</span>
                  </div>
              </div>
          </div>
          <div class="mb-2">
              <div class="shadow-2 p-3 border-round">
                  <div class="flex justify-content-between">
                      <div>
                          <span class="text-900 text-xl mb-3 font-medium mb-3">測驗頁</span>
                      </div>
                  </div>
                  <div>
                    <span class="text-700 line-height-3">1~4：選擇。0：聲音。</span>
                  </div>
              </div>
          </div>
    </div>
  `,
  styleUrl: './popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupComponent {

  action = Action;

  voices: any[] = [];
  messageService = inject(MessageService);
  changeDetectorRef = inject(ChangeDetectorRef);
  appRef: ApplicationRef = inject(ApplicationRef);

  selectedVoice = signal('Nicky');
  selectedPitch = signal(1);
  selectRate = signal(0.7);
  selectVolume = signal(1);

  isFirstTrigger = true;
  updateVoiceSettings = effect(() => {
    const voice = this.selectedVoice();
    const pitch = this.selectedPitch();
    const rate = this.selectRate();
    const volume = this.selectVolume();
    if (this.isFirstTrigger) {
      this.isFirstTrigger = false;
      return;
    }
    chrome.storage.local.set({
      voice,
      pitch,
      rate,
      volume
    });
  });

  openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  sendMessage(action: Action) {
    chrome.runtime.sendMessage({ action });
  }

  constructor() {
    effect(() => {
      speechSynthesis.onvoiceschanged = () => {
        let voices = speechSynthesis.getVoices();
        const wellVoices = [
          'Aaron',
          'Nicky',
          'Samantha',
          'Microsoft',
        ];
        let usVoices = voices
          .filter(voice => voice.lang === 'en-US')
          .filter(voice => {
            let isPass = false;
            wellVoices.forEach(wellVoice => {
              if (voice.name.includes(wellVoice)) {
                isPass = true;
              }
            });
            return isPass;
          });

        this.voices = usVoices.map(voice => {
          return {
            label: voice.name,
            value: voice.name
          };
        });
      };
    });
    effect(async () => {
      const storage = await chrome.storage.local.get(['voice', 'pitch', 'rate', 'volume']);
      this.selectedVoice.set(storage['voice'] || 'Nicky');
      this.selectedPitch.set(storage['pitch'] || 1);
      this.selectRate.set(storage['rate'] || 0.7);
      this.selectVolume.set(storage['volume'] || 1);
    });
    chrome.runtime.onMessage.addListener((request:Message, sender, sendResponse) => {
      if (request.action === Action.GAME_CONTROLLER_CONNECTION_SUCCESS) {
        this.messageService.add({
          severity:'success', 
          summary: '提示', 
          detail: 'switch pro 手把，連線測試成功！',
        });
        this.appRef.tick();
      }
    });
  }

  playVoice() {
    let utterance = new SpeechSynthesisUtterance('Defines whether the flexible items should wrap or not.');
    const selectedVoice = this.selectedVoice();
    utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === selectedVoice) as any
    utterance.pitch = this.selectedPitch();
    utterance.rate = this.selectRate();
    utterance.volume = this.selectVolume();
    speechSynthesis.speak(utterance);
  }

}
