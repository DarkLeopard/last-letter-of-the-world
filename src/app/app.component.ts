import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FormControl} from "@angular/forms";
import {BehaviorSubject} from "rxjs";

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
export class AppComponent {
  public isGameNew$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  public dict: IDict;

  public playerWord: FormControl = new FormControl(undefined);
  public pcWord: FormControl = new FormControl({value: undefined, disabled: true});

  constructor(
    private http: HttpClient,
  ) {
    this.http.get('./assets/dict/russian_nouns_with_definition.json')
      .subscribe((dict: IDict) => {
        this.dict = dict;
        this.pcTurn();
      })
  }

  public get lastLetter(): string {
    return (this.pcWord.value as string).split('').reverse()[0];
  }

  public startGame(): void {
    this.isGameNew$.next(false);
  }

  public playerTurn(): void {
    const newWord: string | undefined = this.playerWord.value;
    if (this.lastLetter !== newWord.split('')[0]) {
      this.playerWord.setErrors({notLastLetter: true});
    } else {
      this.pcTurn();
    }
  }

  private pcTurn(): void {
    const lastLetter: string = (this.playerWord.value as string)?.split('')?.reverse()?.[0] || Object.keys(this.dict)[0][0];
    const newWord = this.shuffleArr(
      Object.keys(this.dict)
        .filter((word) => {
          return word.split('')[0] === lastLetter;
        })
    )[0];
    this.pcWord.setValue(newWord);
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
