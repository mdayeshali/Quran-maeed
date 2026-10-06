/* =========================================
   Islamic Light
   Dynamic Update Banner
   ========================================= */

(function () {

    "use strict";


    /* =====================================
       SETTINGS
       ===================================== */

    const JSON_URL = "/data/update.json";

    const AUTO_SLIDE_TIME = 6000;


    /* =====================================
       VARIABLES
       ===================================== */

    let updates = [];

    let currentIndex = 0;

    let slideTimer = null;

    let isAnimating = false;


    /* =====================================
       ELEMENTS
       ===================================== */

    const card =
        document.getElementById("updateCard");

    const icon =
        document.getElementById("updateIcon");

    const badge =
        document.getElementById("updateBadge");

    const date =
        document.getElementById("updateDate");

    const title =
        document.getElementById("updateTitle");

    const description =
        document.getElementById("updateDescription");

    const button =
        document.getElementById("updateButton");

    const buttonText =
        document.getElementById("updateButtonText");

    const number =
        document.getElementById("updateNumber");

    const dots =
        document.getElementById("updateDots");

    const prevButton =
        document.getElementById("updatePrev");

    const nextButton =
        document.getElementById("updateNext");


    /* =====================================
       LOAD JSON
       ===================================== */

    async function loadUpdates() {

        try {

            const response =
                await fetch(JSON_URL);

            if (!response.ok) {

                throw new Error(
                    "Update JSON could not be loaded."
                );
            }


            const data =
                await response.json();


            if (
                !data.updates ||
                !Array.isArray(data.updates) ||
                data.updates.length === 0
            ) {

                throw new Error(
                    "No updates found."
                );
            }


            updates = data.updates;


            createDots();


            showUpdate(0);


            startAutoSlide();


        } catch (error) {

            console.error(
                "Update Banner Error:",
                error
            );

            hideBanner();

        }

    }


    /* =====================================
       SHOW UPDATE
       ===================================== */

    function showUpdate(index) {

        if (!updates.length) return;


        currentIndex =
            (index + updates.length)
            % updates.length;


        const item =
            updates[currentIndex];


        icon.textContent =
            item.icon || "✦";


        badge.textContent =
            item.badge || "নতুন আপডেট";


        date.textContent =
            item.date || "";


        title.textContent =
            item.title || "";


        description.textContent =
            item.description || "";


        buttonText.textContent =
            item.buttonText || "দেখুন";


        button.href =
            item.link || "#";


        number.textContent =
            `${currentIndex + 1} / ${updates.length}`;


        updateDots();

    }


    /* =====================================
       CHANGE UPDATE
       ===================================== */

    function changeUpdate(index) {

        if (isAnimating) return;

        if (updates.length <= 1) return;


        isAnimating = true;


        card.classList.add(
            "is-changing"
        );


        setTimeout(function () {

            showUpdate(index);


            card.classList.remove(
                "is-changing"
            );


            setTimeout(function () {

                isAnimating = false;

            }, 250);


        }, 250);

    }


    /* =====================================
       NEXT
       ===================================== */

    function nextUpdate() {

        changeUpdate(
            currentIndex + 1
        );

        restartAutoSlide();

    }


    /* =====================================
       PREVIOUS
       ===================================== */

    function previousUpdate() {

        changeUpdate(
            currentIndex - 1
        );

        restartAutoSlide();

    }


    /* =====================================
       DOTS
       ===================================== */

    function createDots() {

        dots.innerHTML = "";


        updates.forEach(
            function (_, index) {

                const dot =
                    document.createElement("button");


                dot.type = "button";


                dot.className =
                    "update-dot-item";


                dot.setAttribute(
                    "aria-label",
                    `Update ${index + 1}`
                );


                dot.addEventListener(
                    "click",
                    function () {

                        changeUpdate(index);

                        restartAutoSlide();

                    }
                );


                dots.appendChild(dot);

            }
        );

    }


    /* =====================================
       ACTIVE DOT
       ===================================== */

    function updateDots() {

        const allDots =
            dots.querySelectorAll(
                ".update-dot-item"
            );


        allDots.forEach(
            function (dot, index) {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );

            }
        );

    }


    /* =====================================
       AUTO SLIDE
       ===================================== */

    function startAutoSlide() {

        stopAutoSlide();


        if (updates.length <= 1) return;


        slideTimer =
            setInterval(
                function () {

                    changeUpdate(
                        currentIndex + 1
                    );

                },
                AUTO_SLIDE_TIME
            );

    }


    /* =====================================
       STOP AUTO SLIDE
       ===================================== */

    function stopAutoSlide() {

        if (slideTimer) {

            clearInterval(
                slideTimer
            );

            slideTimer = null;

        }

    }


    /* =====================================
       RESTART
       ===================================== */

    function restartAutoSlide() {

        startAutoSlide();

    }


    /* =====================================
       HIDE BANNER
       ===================================== */

    function hideBanner() {

        const section =
            document.getElementById(
                "updateSection"
            );


        if (section) {

            section.style.display =
                "none";

        }

    }


    /* =====================================
       BUTTON EVENTS
       ===================================== */

    prevButton.addEventListener(
        "click",
        previousUpdate
    );


    nextButton.addEventListener(
        "click",
        nextUpdate
    );


    /* =====================================
       PAUSE ON HOVER
       ===================================== */

    card.addEventListener(
        "mouseenter",
        stopAutoSlide
    );


    card.addEventListener(
        "mouseleave",
        startAutoSlide
    );


    /* =====================================
       START
       ===================================== */

    loadUpdates();


})();
