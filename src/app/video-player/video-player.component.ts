import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';

import videojs from 'video.js';
import 'videojs-mobile-ui';
import {subTitleLanguageList} from "../support-language";

@Component({
  selector: 'video-player',
  template: `
        <video #target class="video-js" controls muted playsinline preload="none" crossorigin></video>
      `,
  styles: []
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('target', {static: true}) target: ElementRef;
  // see options: https://github.com/videojs/video.js/blob/maintutorial-options.html
  @Input() options: {
    fluid: boolean,
    aspectRatio?: string,
    autoplay: boolean,
    sources: {
      src: string,
      type: string,
    }[],
    tracks: any[]

  };
  player: videojs.Player;

  constructor(
    private elementRef: ElementRef,
  ) { }

  ngOnInit() {
    this.options.tracks = this.options.tracks.map(track => {
      const index = subTitleLanguageList.findIndex(subtitle => subtitle.language === track.language);
      return {
        src: track.vttURL,
        kind: 'captions',
        srclang: track.language,
        label: subTitleLanguageList[index].text
      }
    });
    // this.player = videojs(this.target.nativeElement, this.options, function onPlayerReady() {
    // });
    this.player = videojs(this.target.nativeElement, this.options);
    this.player.mobileUi();
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
