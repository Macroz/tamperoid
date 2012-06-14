(defproject tampere "1.0.0-SNAPSHOT"
  :description "Tampere prototype"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [hiccup "1.0.0-RC2"]
                 [ring/ring-jetty-adapter "1.1.0-RC1"]]
  :dev-dependencies [[swank-clojure "1.2.1"]
                     [lein-ring "0.4.5"]
                     [ring-serve "0.1.2"]]
  :plugins [[lein-cljsbuild "0.2.1"]]
  :cljsbuild {
              :builds [{
                        :source-path "src-cljs"
                        :compiler {
                                   :output-to "resources/public/js/cljs.js"  ; default: main.js in current directory
                                   :optimizations :whitespace
                                   :pretty-print true}}]}
  :ring {:handler tampere.core/app})
