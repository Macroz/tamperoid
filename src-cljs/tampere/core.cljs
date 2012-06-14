(ns tampere.core)

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
   (string? x) x
   (keyword? x) (name x)
   (map? x) (.-strobj (reduce (fn [m [k v]]
                                (assoc m (clj->js k) (clj->js v))) {} x))
   (coll? x) (apply array (map clj->js x))
   :else x))

(def data (atom {:x 0 :y 0 :tx 0 :ty 0 :bullets [] :dir {:dx 1 :dy 0} :asteroids [] :nasteroids 0 :level 0 :score 0 :advance 0 :dead? false}))
(def gee (atom nil))
(def ctx (atom nil))

(defn circle [x y rad]
  (.beginPath @ctx)
  (.arc @ctx x y rad rad 0 (* 2.0 Math/PI) true)
  (.closePath @ctx)
  (.fill @ctx))

(defn line [x1 y1 x2 y2]
  (.beginPath @ctx)
  (.moveTo @ctx x1 y1)
  (.lineTo @ctx x2 y2)
  (.closePath @ctx)
  (.stroke @ctx))

(defn on-screen? [{x :x y :y}]
  (let [width (. @gee -width)
        height (. @gee -height)]
    (and (< 0 (inc x))
         (< x (inc width))
         (< 0 (inc y))
         (< y (inc height)))))

(defn generate-asteroid []
  (let [width (. @gee -width)
        height (. @gee -height)
        r (rand-int 4)
        r2 (rand 180)
        speed (+ 5 (rand 5) (rand 10) (rand 20))
        [x y d] (case r
                      0 [(rand width) 5 r2]
                      1 [(- width 5) (rand height) (+ 90 r2)]
                      2 [(rand width) (- height 5) (- r2)]
                      3 [5 (rand height) (+ 260 r2)])
        new-asteroid {:x x :y y
                      :dir {:dx (* speed (Math/cos (* Math/PI (/ d 180.0))))
                            :dy (* speed (Math/sin (* Math/PI (/ d 180.0))))}
                      :size (+ 5 (rand-int 25) (rand-int 10))
                      :life 1}
        asteroids (@data :asteroids)]
    (swap! data (fn [] (assoc @data :asteroids (conj asteroids new-asteroid))))))

(defn start-level []
  (let [level (inc (@data :level))]
    (swap! data (fn [] (assoc @data
                              :nasteroids (Math/round (* level (Math/sqrt level)))
                              :advance 0
                              :level level)))))

(defn move-object [object]
  (let [{x :x y :y {dx :dx dy :dy} :dir life :life} object]
    (assoc object :x (+ x dx) :y (+ y dy))))

(defn alive? [object]
  (> (object :life) 0))

(defn decrease-life [object]
  (assoc object :life (dec (object :life))))

(defn collide? [object1 object2]
  (let [{x1 :x y1 :y size1 :size} object1
        {x2 :x y2 :y size2 :size} object2
        dx (- x1 x2)
        dy (- y1 y2)]
    (< (+ (* dx dx) (* dy dy)) (+ (* size1 size1) (* size2 size2)))))

(defn simulate []
  (let [{x :x y :y tx :tx ty :ty} @data
        dx (- tx x)
        dy (- ty y)
        len (Math/sqrt (+ (* dx dx) (* dy dy)))
        speed 0.1]
    (when (> len 0)
      (swap! data (fn [] (assoc @data
                                :x (+ x (* dx speed))
                                :y (+ y (* dy speed))
                                :dir {:dx (/ dx len)
                                      :dy (/ dy len)})))))

  (when (@data :shooting?)
    (swap! data (fn [] (assoc @data :bullets (concat (@data :bullets)
                                                     (let [nbullets (inc (* 2 (Math/round (/ (@data :level) 3))))]
                                                       (for [b (range nbullets)]
                                                         (let [x (@data :x)
                                                               y (@data :y)
                                                               bspeed 80
                                                               {dx :dx dy :dy} (@data :dir)
                                                               a (+ (/ Math/PI 2)
                                                                    (- (Math/atan2 dx dy))
                                                                    (if (= b 0)
                                                                      0
                                                                      (* (Math/floor (/ (dec b) 2)) (dec (* 2 (mod b 2))) 0.12)))
                                                               dir {:dx (* bspeed (Math/cos a)) :dy (* bspeed (Math/sin a))}]
                                                           {:x x :y y :dir dir :life 20 :size 1}))))))))

  (swap! data (fn [] (assoc @data :asteroids
                            (filter on-screen?
                                    (for [asteroid (@data :asteroids)]
                                      (-> asteroid
                                          move-object))))))
  (swap! data (fn [] (assoc @data :bullets
                            (filter alive?
                                    (for [bullet (@data :bullets)]
                                      (-> bullet
                                          move-object
                                          decrease-life))))))
  (let [n1 (count (@data :asteroids))]
    (swap! data (fn [] (assoc @data :asteroids
                              (filter alive?
                                      (for [asteroid (@data :asteroids)]
                                        (if (empty? (filter (partial collide? asteroid) (@data :bullets)))
                                          asteroid
                                          (assoc asteroid :life (dec (asteroid :life)))))))))
    (let [killed (- n1 (count (@data :asteroids)))]
      (swap! data (fn [] (assoc @data
                                :advance (+ (@data :advance) killed)
                                :score (+ (@data :score) (* (@data :level) killed)))))))

  (when-not (empty? (filter (partial collide? @data) (@data :asteroids)))
    (swap! data (fn [] (assoc @data :dead? true))))

  (if (>= (@data :advance) (@data :nasteroids))
    (start-level))

  (when (< (count (@data :asteroids)) (@data :nasteroids))
    (generate-asteroid)))

(defn draw []
  (when-not (@data :dead?)
    (simulate))
  (let [width (. @gee -width)
        height (. @gee -height)]
    (set! (. @ctx -fillStyle) "rgb(0, 0, 0)")
    (.fillRect @ctx 0 0 width height)

    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -strokeStyle) "rgba(255, 255, 255, 0.2)")
    (when-not (@data :dead?)
      (line (:x @data) (:y @data) (:tx @data) (:ty @data)))
    (circle (:x @data) (:y @data) 20)

    ;;(set! (. @ctx -fillStyle) "rgba(255, 255, 255, 0.2)")
    ;;(circle (:tx @data) (:ty @data) 10)
    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -font) "bold 30px sans-serif")
    (set! (. @ctx -textAlign) "left")
    (set! (. @ctx -textBaseline) "middle")
    (set! (. @ctx -font) "20pt Courier New")
    (.fillText @ctx (str "fps " (Math/round (. @gee -frameRate))) 50 40)
    (.fillText @ctx (str "level " (@data :level) "(" (- (@data :nasteroids) (@data :advance)) ")") 50 80)
    (.fillText @ctx (str "score " (@data :score)) 50 120)
    (when (@data :dead?)
      (set! (. @ctx -textAlign) "center")
      (set! (. @ctx -font) "60pt Courier New")
      (.fillText @ctx (str "G A M E  O V E R") (/ width 2) (/ height 2)))
    ;;(.fillText @ctx (str "bullets " (count (@data :bullets))) 50 80)
    ;;(.fillText @ctx (str "asteroids " (count (@data :asteroids))) 50 120)
    (dorun (for [bullet (@data :bullets)]
             (let [{x :x y :y {dx :dx dy :dy} :dir} bullet]
               (set! (. @ctx -strokeStyle) "rgba(255, 255, 255, 0.5)")
               (line x y (- x dx) (- y dy))
               )))
    (dorun (for [asteroid (@data :asteroids)]
             (let [{x :x y :y {dx :dx dy :dy} :dir size :size} asteroid]
               (set! (. @ctx -strokeStyle) "rgba(0, 200, 0, 0.5)")
               (set! (. @ctx -fillStyle) "rgb(0, 200, 0)")
               ;;(line x y (- x (* dx 10.0)) (- y (* dy 10.0)))
               (circle x y size)
               )))))

(defn move []
  (swap! data (fn [] (assoc @data :tx (. @gee -mouseX) :ty (. @gee -mouseY)))))

(defn noshoot []
  (swap! data (fn [] (assoc @data :shooting? false))))

(defn shoot []
  (swap! data (fn [] (assoc @data :shooting? true))))

(defn start []
  (swap! gee (fn [] (new (. js/window -GEE)
                         (clj->js {:fullscreen true
                                   :context "2d"}))))
  (swap! ctx (fn [] (. @gee -ctx)))
  (set! (. @gee -draw) draw)
  (set! (. @gee -mousemove) move)
  (set! (. @gee -mousedown) shoot)
  (set! (. @gee -mouseup) noshoot)
  (set! (. @gee -mousedrag) move)
  (.appendChild (. js/document -body) (. gee -domElement)))
