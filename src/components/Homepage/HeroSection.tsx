import React from "react";
import { Button } from "../Button";
import styles from "@/styles/Home.module.scss";
import { AppConfig } from "@/utils/AppConfig";
import { MdOutlineLogin } from "react-icons/md";
import BackgroundPage from "./HeroBackground";

type HeroSectionProps = {
  description: string;
  actionLabel: string;
  actionHref: string;
};

const HeroSection = ({
  description,
  actionLabel,
  actionHref,
}: HeroSectionProps) => {
  return (
    <>
      <BackgroundPage />
      <div className={styles.heroSectionWrapper}>
        <h1 className={styles.heading}>{AppConfig.siteName}</h1>

        <div className={styles.description}>
          {description.split("_").map((word, index) =>
            index % 2 ? (
              <span key={index} className={styles.highlight}>
                {word}
              </span>
            ) : (
              <span key={index}>{word}</span>
            )
          )}
        </div>

        <Button
          xl
          Icon={MdOutlineLogin}
          href={actionHref}
          label={actionLabel}
        />
      </div>
    </>
  );
};

export default HeroSection;
