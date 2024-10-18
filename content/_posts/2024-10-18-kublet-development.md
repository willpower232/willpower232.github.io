---
layout: post
title: Kublet Development
description: My adventures in developing for the kublet arduino device
category: computing
tags: linux
---

_this post is referring to the kublet arduino device available from [thekublet.com](https://thekublet.com), if you're here for kubernetes because search engines have taken a dive in quality, I can only apologise_

![My kublet at home](/assets/img/20241018_100332.JPG)

## Setting Up

I hasten to add that I have never worked with c++ (aka cpp) or arduino development before so if I get anything wrong, bear with me. Also the information available at [developers.thekublet.com](https://developers.thekublet.com) does have a few gaps.

I am already a Visual Studio Code (or VSCodium) person and I work exclusively on Linux computers so if you're not using either of those, I'm sorry for you.

I needed to `sudo apt install python3-venv` in order for PlatformIO to work so do that first.

I grabbed the [PlatformIO](https://platformio.org) extension for Code but apparently you can install the CLI directly but I don't know what that means beyond you probably have to manage your own dependency installations.

Finally you need the krate binary from the kublet maker, I got mine from [Github](https://github.com/kublet/krate), as well as the kublet mobile app for your phone.

You almost definitely need a different micro USB cable in order to get the serial output but only time will tell. If you do want this then you probably also need to plug directly into your computer rather than through a USB hub which can still power the device, just not route the serial connection properly at least in my case.

One other pain point, when connecting the kublet to the computer and trying to run `krate monitor` I got permission errors. Now that it was connected I was able to `ls -hal /dev/ttyUSB0` and see that the `dialout` group has access to it so I needed to `sudo usermod -aG dialout wh` and reboot in order to see the serial output.

## Getting Started

I set up the working directory and a git repo as I normally do at the start of a new project. I then needed to `krate init` to get everything happening. You can also reference [their community GitHub](https://github.com/kublet/community/tree/main/apps/bored) to see what structure you should end up with, I liked how the PlatformIO extension automatically installs any changes to the platformio.ini file which is handy.

You can also look at the contents of `main.cpp` to get started (mostly because I'd never seen c++ code before). I wanted my screen to reference a remote API so this bored project was also pretty close.

As a couple of major roadblocks, ArduinoJSON.h should be ArduinoJson.h as it is case sensitive and I had to copy HTTPClient.h and HTTPClient.cpp into the src directory in order to use a custom header making a request to my API.

## Development

As a scripting language, it works top to bottom so I added a function between setup and loop which drew to the screen so that loop could send through testing data and I could see what the screen looks like completely filled. Unfortunately, I wanted to set three separate variables to 888 but that caused some kind of memory issue and crashed the device.

The `ui.drawText` method specifically requires a `const char*` (probably also called a reference) so I had to change the type of some data from my REST API which is a little annoying. Apparently this uses C++11 so I was able to do the following:

```cpp
JsonObject stats_hpa = doc["hpa"];
int hpaMinInt = stats_hpa["min"];
std::string hpaMinTemp = std::to_string(hpaMinInt);
const char* hpaMin = hpaMinTemp.c_str();
```

Even though the sprite looks like it is 240 by 150, you can actually address the entire 240x240 screen. I did choose to `ui.clear()` before writing to the screen a second time, I tried to just overwrite some parts but it didn't really work so mostly you just have to remember to draw things top to bottom, left to right, and you should have a good time.

### Todo

I briefly considered [ESP-NOW](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html) as hinted by the developer docs since I have three kublets but it was easier to just develop one application and deploy it three times.

On the standard apps you can press the button on the back to access a menu but that didn't seem possible with my output so I can only presume the documentation is missing something.

## Deployment

When you think you're ready to try something, you can use `krate build` to confirm it builds. I'm not sure if it is necessary before each `krate send <ip>` but it does offer piece of mind.

Also when you want to reset the device, plug it in whilst holding the button on the back, this will eventually flash the screen white and you'll see the "Open mobile app" message. **Make sure not to apply pressure to the screen whilst you do this**

I found that the mobile app (1.0.5 on Android anyway) needed to have the storage reset in order to allow me to change the name of a second kublet but then I was reflashing it repeatedly during this process anyway so I only named it on the final run. The mobile app is the only way to apply the WiFi details (2.4Ghz only btw) so a little annoying. Flashing the Developer app to the device will take a few minutes but the screen on the device (and the serial output) will tell you which IP address you can `krate send <ip>` to.

I had some problems so I ended up resetting the device all the time but once you know the IP address of the device, you should be able to `krate send <ip>` to it repeatedly until you're happy.
