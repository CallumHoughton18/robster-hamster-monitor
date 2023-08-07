export const isInFestiveSeason = (givenDate: Date): boolean => {
  const dateCopy = new Date(givenDate.getTime());
  const givenYear = dateCopy.getFullYear();
  const beginningFestiveSeason = new Date(givenYear, 11, 24);
  const endFestiveSeason = new Date(givenYear, 11, 26);

  givenDate.setDate(dateCopy.getDate() + 1);
  return dateCopy >= beginningFestiveSeason && dateCopy < endFestiveSeason;
};
