import {Component, OnInit} from '@angular/core';
import {AuthService} from "../auth/auth.service";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NzMessageService} from "ng-zorro-antd/message";
import {AppService} from "../app.service";
import {subTitleLanguageList, transcriptLanguageList} from '../support-language';
import {ReadVideoDto} from "../dtos/read-video.dto";
import {NzModalRef, NzModalService} from "ng-zorro-antd/modal";
import {EnvService} from "../env.service";
import {NgxSpinnerService} from 'ngx-spinner';
import {NzUploadXHRArgs} from "ng-zorro-antd/upload";
import * as AWS from 'aws-sdk';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  currentUserName: string;
  envJson: string;
  isGenerating = false;

  transcriptLanguageList = transcriptLanguageList;
  subTitleLanguageList = subTitleLanguageList;

  isPlayerModalVisible = false;
  isVideoUploadModalVisible = false;
  isGenerateSubtitleModalVisible = false;

  current = 0;
  searchVideo = {title: ''};
  isUploading = false;

  videos: ReadVideoDto[] = [];
  selectedVideo: ReadVideoDto;

  validateForm!: FormGroup;

  uploadVideoId: string;
  targetSourceLanguage: string;
  selectedVideoForGenerate: ReadVideoDto;

  confirmModal?: NzModalRef;

  constructor(
    public env: EnvService,
    private fb: FormBuilder,
    private readonly router: Router,
    private readonly nzMessageService: NzMessageService,
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly spinner: NgxSpinnerService,
    private modal: NzModalService,
  ) {
    if (this.env.AssetsDistributionUrl && this.env.ApiUrl) {
      if (!this.authService.user) {
        this.router.navigate(['/signin']);
      } else {
        this.spinner.show();
        this.authService.setCredentials().then(() => {
          this.currentUserName = this.authService.getUserName();
          this.appService.readVideoDtos(this.currentUserName).then(() => {
            this.appService.videosBehavior.subscribe(videos => {
              this.videos = videos;
              this.spinner.hide();
              videos.forEach((videoTemp, index) => {
                if (videoTemp.languages && videoTemp.languages.length > 0) {
                  const notGenerateYetSubtitleIndex = videoTemp.languages.findIndex(language => !language.vttURL || !language.srtURL);
                  if (notGenerateYetSubtitleIndex !== -1) {
                    this.videos[index].isGenerating = true;
                    this.isGenerating = true;
                  } else {
                    this.videos[index].isGenerating = false;
                  }
                  const interval = setInterval(async () => {
                    const notGenerateYetSubtitleIndex = videoTemp.languages.findIndex(language => !language.vttURL || !language.srtURL);
                    if (notGenerateYetSubtitleIndex !== -1) {
                      this.videos[index].isGenerating = true;
                      const video = await this.appService.readVideoDto(videoTemp.videoId);
                      const {languages} = video;
                      if (languages[notGenerateYetSubtitleIndex].srtURL && languages[notGenerateYetSubtitleIndex].vttURL) {
                        this.videos[index].languages[notGenerateYetSubtitleIndex] = languages[notGenerateYetSubtitleIndex];
                        const checkNextIndex = this.videos[index].languages.findIndex(language => !language.vttURL || !language.srtURL);
                        if (checkNextIndex === -1 && this.videos[index]) {
                          this.videos[index].isGenerating = false;
                          this.isGenerating = false;
                        }
                        clearInterval(interval);
                      } else {
                        this.isGenerating = true;
                      }
                    } else {
                      if (this.videos[index]) {
                        this.videos[index].isGenerating = false;
                      }
                      clearInterval(interval);
                    }
                  }, 1000);
                }
              });
            });
          }).catch(err => {
            this.spinner.hide();
            this.env.ApiUrl = undefined;
            this.nzMessageService.error(`Error : ${err.message}`, {nzDuration: 5000});
          });
        });
      }
    }
  }


  ngOnInit(): void {
    this.validateForm = this.fb.group({
      title: [null, [Validators.required]],
      description: [null],
      sourceLanguageCode: [null, [Validators.required]],
    });
  }

  showPlayerModal(video: ReadVideoDto): void {
    this.isPlayerModalVisible = true;
    this.selectedVideo = video;
  }

  showVideoUploadModal(): void {
    this.isVideoUploadModalVisible = true;
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.createVideo();
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({onlySelf: true});
        }
      });
    }
  }

  createVideo(): void {
    this.spinner.show();
    const {title, description, sourceLanguageCode} = this.validateForm.getRawValue();
    this.appService.createVideo({
      title,
      userName: this.currentUserName,
      description,
      hasTranscript: false,
      sourceLanguageCode,
      createdAt: (new Date()).getTime(),
    }).then(createdVideo => {
      this.uploadVideoId = createdVideo.videoId;
      this.spinner.hide();
      this.current += 1;
    });
  }

  customUploadReq = (item: NzUploadXHRArgs) => {
    this.isUploading = true;
    const s3 = new AWS.S3();
    const params = {
      Bucket: this.env.AssetsBucketName,
      Key: `video-source/${this.uploadVideoId}.mp4`,
      Body: item.file,
    };
    s3.upload(params)
      .on('httpUploadProgress', ({loaded, total}) => {
        item.onProgress(
          {
            percent: Math.round((loaded / total) * 100)
          },
          item.file
        );
      })
      .send((err, data) => {
        this.spinner.show();
        if (err) {
          item.onError(err, item.file);
          this.isUploading = false;
          this.spinner.hide();
          this.nzMessageService.error(err.message, {nzDuration: 5000});
        } else {
          item.onSuccess(data.response, item.file, data);
          this.isUploading = true;
          this.appService.updateVideo(this.uploadVideoId, {
            sourceFileURL: `${this.env.AssetsDistributionUrl}/video-source/${this.uploadVideoId}.mp4`
          }).then(() => {
            this.appService.readVideoDto(this.uploadVideoId).then(video => {
              this.appService.videosBehavior.next([video, ...this.videos]);
              this.spinner.hide();
              this.isUploading = false;
              this.handleCancel();
              this.nzMessageService.success(`${item.file.name} file upload is success! Let's generate subtitle!`, {nzDuration: 5000});
            });
          })
        }
      });
  };

  handleCancel(): void {
    this.isPlayerModalVisible = false;
    this.isVideoUploadModalVisible = false;
    this.current = 0;
    this.uploadVideoId = null;
    this.validateForm.reset();
  }

  openGenerateSubtitleModal(video: ReadVideoDto): void {
    this.selectedVideoForGenerate = video;
    this.isGenerateSubtitleModalVisible = true;
    if (video.languages && video.languages.length > 0) {
      this.subTitleLanguageList = subTitleLanguageList
        .filter(language => language.code !== video.sourceLanguageCode)
        .filter(language => {
          const index = video.languages.findIndex(tempLanguage => tempLanguage.language === language.language);
          return index === -1;
        });
    }
  }

  cancelGenerateSubtitle(): void {
    this.isGenerateSubtitleModalVisible = false;
    this.targetSourceLanguage = null;
    this.selectedVideoForGenerate = null;
    this.subTitleLanguageList = subTitleLanguageList;
  }

  async createSubtitle(): Promise<void> {
    this.spinner.show();
    try {
      this.isGenerating = true;
      const {videoId, sourceLanguageCode, hasTranscript, languages} = this.selectedVideoForGenerate;
      this.selectedVideoForGenerate = null;
      const targetLanguage = this.targetSourceLanguage;
      const videoIndex = this.videos.findIndex(video => video.videoId === videoId);
      await this.appService.createSubtitle({
        videoId, sourceLanguageCode, hasTranscript,
        targetLanguage,
        sourceTranscriptURL: null,
      });
      if (hasTranscript) {
        await this.appService.updateVideo(videoId, {
          languages: [...languages, {
            language: targetLanguage,
            srtURL: null,
            vttURL: null,
          }]
        });
        this.videos[videoIndex].languages = [...languages, {
          language: targetLanguage,
          srtURL: null,
          vttURL: null,
        }];
        this.videos[videoIndex].isGenerating = true;
        const interval = setInterval(async () => {
          const video = await this.appService.readVideoDto(videoId);
          const {languages} = video;
          const languageIndex = languages.findIndex(language => language.language === targetLanguage);
          if (languages[languageIndex].srtURL && languages[languageIndex].vttURL) {
            this.videos[videoIndex].languages[languageIndex] = languages[languageIndex];
            this.videos[videoIndex].isGenerating = false;
            this.isGenerating = false;
            clearInterval(interval);
          } else {
            this.isGenerating = true;
          }
        }, 1000);
      } else {
        this.videos[videoIndex].isGenerating = true;
        await this.appService.updateVideo(videoId, {
          languages: [
            {
              language: sourceLanguageCode.split('-')[0],
              srtURL: null,
              vttURL: null,
            },
            {
              language: this.targetSourceLanguage,
              srtURL: null,
              vttURL: null,
            }
          ]
        });
        this.videos[videoIndex].hasTranscript = true;
        this.videos[videoIndex].languages = [
          {
            language: sourceLanguageCode.split('-')[0],
            srtURL: null,
            vttURL: null,
          },
          {
            language: this.targetSourceLanguage,
            srtURL: null,
            vttURL: null,
          }
        ];
        const sourceInterval = setInterval(async () => {
          const video = await this.appService.readVideoDto(videoId);
          const {languages} = video;
          const languageIndex = languages.findIndex(language => language.language === sourceLanguageCode.split('-')[0]);
          if (languages[languageIndex].srtURL && languages[languageIndex].vttURL) {
            this.videos[videoIndex].languages[languageIndex] = languages[languageIndex];
            this.videos[videoIndex].isGenerating = false;
            this.isGenerating = false;
            clearInterval(sourceInterval);
          }
        }, 1000);

        const targetInterval = setInterval(async () => {
          const video = await this.appService.readVideoDto(videoId);
          const {languages} = video;
          const languageIndex = languages.findIndex(language => language.language === targetLanguage);
          if (languages[languageIndex].srtURL && languages[languageIndex].vttURL) {
            this.videos[videoIndex].languages[languageIndex] = languages[languageIndex];
            this.videos[videoIndex].isGenerating = false;
            this.isGenerating = false;
            clearInterval(targetInterval);
          }
        }, 1000);
      }
      this.spinner.hide();
      this.cancelGenerateSubtitle();
      this.nzMessageService.success(`Subtitle generation request succeeded! Please wait until the operation is complete.`, {nzDuration: 5000});
    } catch (e) {
      this.isGenerating = false;
      this.nzMessageService.error(`Error : ${e.message}`, {nzDuration: 5000});
    }
  }

  deleteVideo(video: ReadVideoDto): void {
    this.spinner.show();
    this.appService.deleteVideo(video.videoId)
      .then(() => {
        this.appService.readVideoDtos(this.currentUserName).then(() => {
          this.spinner.hide();
          this.nzMessageService.success(`[${video.title}] video is deleted.`, {nzDuration: 5000});
        });
      })
      .catch(err => {
        this.nzMessageService.error(`Error : ${err.message}`, {nzDuration: 5000});
      })
  }

  showConfirm(video: ReadVideoDto): void {
    this.confirmModal = this.modal.confirm({
      nzTitle: 'Do you Want to delete these video?',
      nzContent: 'When clicked the Delete button, Video file and subtitle files of the video will be deleted.',
      nzOkText: 'Delete',
      nzOnOk: () => this.deleteVideo(video),
    });
  }

  languageToText(language: string): string {
    return subTitleLanguageList.find(languageItem => languageItem.language === language).text;
  }

  setEnv(): void {
    try {
      const env = JSON.parse(this.envJson);
      if (!env.ApiStack || !env.CognitoStack || !env.SharedStack) {
        this.nzMessageService.error('Paste whole text in cdk-outputs.json!');
      } else {
        const {ApiStack, CognitoStack, SharedStack} = env;
        const body = {
          AssetsDistributionUrl: SharedStack.AssetsDistributionUrl,
          AssetsBucketName: SharedStack.AssetsBucketName,
          Region: SharedStack.Region,
          ApiUrl: ApiStack.ApiUrl,
          UserPoolId: CognitoStack.UserPoolId,
          UserPoolClientId: CognitoStack.UserPoolClientId,
          IdentityPoolId: CognitoStack.IdentityPoolId,
        };

        this.spinner.show();
        this.appService.setEnv(body).then(() => {
          this.nzMessageService.success(`Success setting environment!`, {nzDuration: 5000});
          setTimeout(() => {
            window.location.reload();
          }, 500)
        }).catch((err) => {
          this.nzMessageService.error(`Error : ${err.message}`, {nzDuration: 5000});
        });
      }
    } catch (err) {
      this.nzMessageService.error('Paste whole text in cdk-outputs.json!');
    }
  }

  reSetEnv(): void {
    this.env.ApiUrl = undefined;
  }

  signOut(): void {
    this.spinner.show();
    this.authService.signOut();
    this.router.navigate(['/signin']);
  }
}
