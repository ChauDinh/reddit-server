import DataLoader from "dataloader";
import { Publication } from "./../entities/Publication";

export const createPublicationLoader = () =>
  new DataLoader<number, Publication>(async (pubIds) => {
    const publications = await Publication.findByIds(pubIds as number[]);
    const publicationIdToPublication: Record<number, Publication> = {};
    publications.forEach((p) => {
      publicationIdToPublication[p.id] = p;
    });

    return pubIds.map((pubId) => publicationIdToPublication[pubId]);
  });
