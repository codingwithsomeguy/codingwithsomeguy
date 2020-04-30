import os
import json
import wordcloud
from PIL import Image, ImageOps
import numpy as np


def main():
    base_logo_path = "../../assets/publiccompany/logos/%s.png"
    base_transcript_path = "../../assets/publiccompany/transcripts/%s.txt"
    ticker = "gm"
    img = Image.open(base_logo_path % ticker)
    img = img.resize((1280, 1080))
    img_color = np.array(img)
    img_color_gen = wordcloud.ImageColorGenerator(img_color)
    stop_words = wordcloud.STOPWORDS
    [stop_words.add(word) for word in ["quarter", "think", "customer", "growth", "Azure"]]
    #img_color_gen = wordcloud.ImageColorGenerator(np.array(Image.open("../../assets/publiccompany/logos/mcd.png")))
    #img_mask = ImageOps.invert(img)
    img_mask = img
    #img_mask.save("nflx-mask.png")
    img_mask = np.array(img_mask)
    #src_text = open("../../assets/publiccompany/transcripts/nflx.txt").read()
    src_text = open(base_transcript_path % ticker).read()
    wc = wordcloud.WordCloud(
        width=1280, height=720, mask=img_mask,
        stopwords=stop_words,
        max_words=1000)
    wc.generate(src_text)
    wc.recolor(color_func=img_color_gen)
    wc.to_file("wc.jpg")


if __name__ == "__main__":
    main()
