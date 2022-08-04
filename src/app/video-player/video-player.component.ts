import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

import videojs from 'video.js';

import {subTitleLanguageList} from "../support-language";

@Component({
  selector: 'video-player',
  template: `
        <video #target class="video-js vjs-big-play-centered" controls muted playsinline preload="auto" crossorigin></video>
      `,
  styles: []
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('target', {static: true}) target: ElementRef;
  @Input() options: {
    fluid: boolean,
    aspectRatio?: string,
    autoplay: boolean,
    sources: {
      src: string,
      type: string,
    }[],
    tracks: any[],
  };

  @Input()
  get currentTime(): number {return this._currentTime; }
  set currentTime(time: number) {
    if (this.player) {
      this.player.currentTime(time / 1000);
    }
    this._currentTime = time / 1000;
  }

  player: videojs.Player;
  private _currentTime = 0;

  constructor(
    private elementRef: ElementRef,
  ) { }

  ngOnInit() {
    if (this.options.tracks && this.options.tracks.length > 0) {
      this.options.tracks = this.options.tracks.map(track => {
        const index = subTitleLanguageList.findIndex(subtitle => subtitle.language === track.language);
        return {
          src: track.vttURL,
          kind: 'captions',
          srclang: track.language,
          label: subTitleLanguageList[index].text,
          default: false,
        }
      });
    }
    this.options.tracks[0].default = true;
    // this.player = videojs(this.target.nativeElement, this.options, function onPlayerReady() {
    // });
    this.player = videojs(this.target.nativeElement, this.options);
    this.player.ready(() => {
      this.player.on('timeupdate', () => {
        this._currentTime = this.player.currentTime();
      });
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    // destroy player
    if (this.player) {
      this.player.dispose();
    }
  }
}
