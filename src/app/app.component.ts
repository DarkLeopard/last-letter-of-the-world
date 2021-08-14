import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FormControl} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {filter} from "rxjs/operators";

interface IDict {
  [key: string]: {
    definition: string;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public isDictReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isGameNew$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  public dict: IDict | undefined;
  public usedWords$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  public playerWord: FormControl = new FormControl(undefined);
  public pcWord: FormControl = new FormControl({value: undefined, disabled: true});

  constructor(
    private http: HttpClient,
  ) {
  }

  public get pcLastLetter(): string {
    return this.getLastLetter(this.pcWord.value);
  }

  public get playerLastLetter(): string {
    return this.getLastLetter(this.playerWord.value);
  }

  public get pcFirstLetter(): string {
    return (this.pcWord.value as string).split('')[0];
  }

  public get playerFirstLetter(): string {
    return (this.playerWord.value as string).split('')[0];
  }

  public ngOnInit(): void {
    this.http.get('./assets/dict/russian_nouns_with_definition.json')
      .subscribe((dict: IDict) => {
        this.dict = dict;
        this.pcTurn(this.getStartLetter());
        this.isDictReady.next(true);
      });

    this.playerWordCaseAutoFixer();
  }

  private getStartLetter(): string {
    return this.shuffleArr('цукенгшщзхфывапролджячсмитбюё'.split(''))[3];
  }

  public startNewGame(): void {
    if (this.isGameNew$.getValue()) {
      this.isGameNew$.next(false);
    } else {
      this.usedWords$.next([]);
      this.pcTurn(this.getStartLetter())
    }
  }

  public playerTurn(): void {
    const playerWord: string = this.playerWord.value;
    // TODO validators
    if (this.pcLastLetter !== this.playerFirstLetter) {
      this.playerWord.setErrors({notLastLetter: true});
    }
    if (this.checkAlreadyUsed(playerWord)) {
      this.playerWord.setErrors({alreadyUsed: true});
    }
    if (!this.checkIsWordInDict(playerWord)) {
      this.playerWord.setErrors({noWordInDict: true});
    } else {
      this.addUsedWord(this.playerWord.value);
      this.pcWord.setValue('');
      this.pcTurn();
    }
  }

  public getWordDescription(word: string): string | undefined {
    return this.dict?.[word]?.definition;
  }

  public getWordHint(): void {
    const hint: string = this.shuffleArr(this.getCanUseWords(this.pcLastLetter))[0];
    this.playerWord.setValue(hint);
  }

  private playerWordCaseAutoFixer(): void {
    this.playerWord.valueChanges
      .pipe(
        filter(Boolean),
      )
      .subscribe((word: string) => {
        const wordLowerCase: string = word.toLocaleLowerCase();
        if (word !== wordLowerCase) {
          this.playerWord.setValue(wordLowerCase, {emitEvent: false});
        }
      })
  }

  private checkIsWordInDict(word: string): boolean {
    return !!Object.keys(this.dict).find((dictWord) => dictWord === word);
  }

  private getLastLetter(word: string): string {
    const letterArr: string[] = word.split('');
    for (let letterFound: boolean = false; !letterFound;) {
      const currentLetter: string | undefined = letterArr[letterArr.length - 1];
      if (!currentLetter) {
        letterFound = true;
        console.error('Cant find letter!');
        letterArr.push('а');
      } else if (this.checkRareLetter(currentLetter)) {
        letterArr.pop();
      } else {
        letterFound = true;
      }
    }
    return letterArr[letterArr.length - 1];
  }

  private checkRareLetter(letter: string): boolean {
    if (['ы', 'й', 'ь', 'ъ', 'э'].some((rareLetter: string) => rareLetter === letter)) {
      return true;
    } else {
      return false;
    }
  }

  private checkAlreadyUsed(word: string): boolean {
    return !!this.usedWords$.value.find((usedWord: string) => usedWord === word);
  }

  private addUsedWord(word: string): void {
    this.usedWords$.next([
      ...this.usedWords$.value,
      word,
    ])
  }

  private pcTurn(lastLetter: string = this.playerLastLetter): void {
    const newWord: string = this.shuffleArr(
      this.getCanUseWords(lastLetter)
    )[0];
    this.pcWord.setValue(newWord);
    this.playerWord.setValue('');
    this.addUsedWord(newWord);
  }

  private getCanUseWords(lastLetter: string): string[] {
    return Object.keys(this.dict)
      .filter((word: string) => {
        const firstLetter: string = word.split('')[0];
        return firstLetter === lastLetter;
      })
      .filter((word: string) => !this.checkAlreadyUsed(word));
  }

  private shuffleArr(array: string[]): string[] {
    let currentIndex = array.length, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }
}
