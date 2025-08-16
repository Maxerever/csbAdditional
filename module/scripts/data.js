export const translations = {
  torso: "Торсу",
  head: "Голове",
  chest: "Груди",
  stomach: "Животу",
  leftHand: "Левой руке",
  leftShoulder: "Левому плечу",
  leftElbow: "Левому локтю",
  leftForearm: "Левому предплечью",
  leftWrist: "Левой кисти",
  rightHand: "Правой руке",
  rightShoulder: "Правому плечу",
  rightElbow: "Правому локтю",
  rightForearm: "Правому предплечью",
  rightWrist: "Правой кисти",
  leftLeg: "Левой ноге",
  leftThigh: "Левому бедру",
  leftKnee: "Левому колену",
  leftShin: "Левой голени",
  leftFoot: "Левой стопе",
  rightLeg: "Правой ноге",
  rightThigh: "Правому бедру",
  rightKnee: "Правому колену",
  rightShin: "Правая голени",
  rightFoot: "Правой стопе"
};

export const healTranslations = {
  torso: "Торс",
  head: "Голова",
  chest: "Грудь",
  stomach: "Живот",
  leftHand: "Левая рука",
  leftShoulder: "Левое плечо",
  leftElbow: "Левый локоть",
  leftForearm: "Левое предплечье",
  leftWrist: "Левая кисть",
  rightHand: "Правая рука",
  rightShoulder: "Правое плечо",
  rightElbow: "Правый локоть",
  rightForearm: "Правое предплечье",
  rightWrist: "Правая кисть",
  leftLeg: "Левая нога",
  leftThigh: "Левое бедро",
  leftKnee: "Левое колено",
  leftShin: "Левая голень",
  leftFoot: "Левая стопа",
  rightLeg: "Правая нога",
  rightThigh: "Правое бедро",
  rightKnee: "Правое колено",
  rightShin: "Правая голень",
  rightFoot: "Правая стопа"
};

export const phrases = [
  "от",
  "просто от неожиданного",
  "пытаясь увернуться от",
  "спасаясь бегством от сокрушительного",
  "чрезмерно засмотревшись на бабочку, не обращая внимания на",
  "не успев заметить",
  "пока был занят другими делами, полностью забыв про",
  "метафорически ослепнув от красоты",
  "решив, что справится с мощным",
  "отдав свою судьбу на суд",
  "досрочно задумав покинуть бренный мир с помощью"
];

export const criticalEffects = {
  1: { label: "Урон ×3", modifier: 3 },
  2: { label: "Урон ×2", modifier: 2 },
  3: { label: "Максимальный урон", type: "max" },
  4: { label: "Урон по DR считается как 100%", note: "DR игнорируется, урон 100%." },
  5: { label: "Двойной шок при уроне сквозь DR", note: "При прохождении DR — двойной шок и травма части тела." },
  6: { label: "Обычный урон, цель роняет предметы", note: "Цель роняет всё, что держит." },
  7: { label: "DR не защищает", note: "Цель теряет защиту от DR.", type: "no_dr"},
  8: { label: "Обычный урон", modifier: 1 }
};

export const hitZones = {
  torso: 0, head: -5, chest: -1, stomach: -2,
  leftHand: -3, leftShoulder: -3, leftElbow: -6,
  leftForearm: -5, leftWrist: -7, rightHand: -3,
  rightShoulder: -3, rightElbow: -6, rightForearm: -5,
  rightWrist: -7, leftLeg: -3, leftThigh: -4,
  leftKnee: -6, leftShin: -5, leftFoot: -7,
  rightLeg: -3, rightThigh: -4, rightKnee: -6,
  rightShin: -5, rightFoot: -7
};